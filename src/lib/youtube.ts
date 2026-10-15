import { google } from "googleapis";
import { getAuthenticatedYoutubeClient } from "@/lib/googleAuth";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export class YoutubeApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "YoutubeApiError";
  }
}

function wrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err) => {
    const status = err?.response?.status ?? err?.code;
    const reason = err?.errors?.[0]?.reason ?? err?.response?.data?.error?.message;
    throw new YoutubeApiError(reason ?? err.message ?? "YouTube API request failed", status);
  });
}

/** 전체 URL, @핸들, 채널ID 등 어떤 형태로 입력돼도 채널을 resolve한다 */
export async function resolveChannel(input: string): Promise<{
  id: string;
  title: string;
  handle: string | null;
  uploadsPlaylistId: string;
}> {
  const trimmed = input.trim();
  let handle: string | undefined;
  let channelId: string | undefined;

  const urlMatch = trimmed.match(
    /youtube\.com\/(?:channel\/(UC[\w-]{22})|@([\w.-]+)|c\/([\w.-]+)|user\/([\w.-]+))/i,
  );
  if (urlMatch) {
    channelId = urlMatch[1];
    handle = urlMatch[2] ?? urlMatch[3] ?? urlMatch[4];
  } else if (trimmed.startsWith("@")) {
    handle = trimmed.slice(1);
  } else if (/^UC[\w-]{22}$/.test(trimmed)) {
    channelId = trimmed;
  } else {
    handle = trimmed;
  }

  const res = await wrap(
    youtube.channels.list({
      part: ["snippet", "contentDetails"],
      ...(channelId ? { id: [channelId] } : { forHandle: handle }),
    }),
  );

  const channel = res.data.items?.[0];
  if (!channel || !channel.id) {
    throw new YoutubeApiError("채널을 찾을 수 없습니다. 입력값을 확인해주세요.", 404);
  }
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YoutubeApiError("채널의 업로드 목록을 찾을 수 없습니다.", 404);
  }

  return {
    id: channel.id,
    title: channel.snippet?.title ?? channel.id,
    handle: channel.snippet?.customUrl ?? null,
    uploadsPlaylistId,
  };
}

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
}

const MAX_CHANNEL_VIDEO_PAGES = 10; // uploads 재생목록 최대 10페이지(최신 500개)까지만 — 업로드가 아주 많은 채널에서 요청이 끝없이 걸리는 것을 방지

/**
 * uploads 재생목록을 페이지네이션으로 순회해 채널의 최신 영상을 가져온다 (최대 500개).
 * knownVideoIds를 주면, 재생목록 순서(최신순)상 한 페이지가 전부 이미 아는 영상이면 그 이후는
 * 더 볼 필요가 없으므로 중단한다 (채널 재방문 시 "새 영상 있는지"만 가볍게 확인하기 위함).
 */
export async function fetchChannelVideos(
  uploadsPlaylistId: string,
  knownVideoIds?: Set<string>,
): Promise<ChannelVideo[]> {
  const videos: ChannelVideo[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    const res = await wrap(
      youtube.playlistItems.list({
        part: ["snippet"],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken,
      }),
    );

    const items = res.data.items ?? [];
    let allKnown = items.length > 0;

    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      if (!knownVideoIds?.has(videoId)) allKnown = false;
      videos.push({
        id: videoId,
        title: item.snippet?.title ?? videoId,
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
        publishedAt: new Date(item.snippet?.publishedAt ?? Date.now()),
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
    page++;
    if (allKnown) break;
  } while (pageToken && page < MAX_CHANNEL_VIDEO_PAGES);

  return videos;
}

export interface FetchedComment {
  id: string;
  parentId: string | null;
  authorName: string;
  authorProfileUrl: string | null;
  textOriginal: string;
  likeCount: number;
  publishedAt: Date;
  updatedAt: Date;
}

/** 영상의 모든 댓글 스레드를 페이지네이션으로 수집. 스레드마다 본댓글 + 대댓글 최대 1개만 추출 */
export async function fetchAllComments(videoId: string): Promise<FetchedComment[]> {
  const comments: FetchedComment[] = [];
  let pageToken: string | undefined;
  // 멤버십 영상 댓글은 API 키만으로는 403이 나므로, 구글 계정이 연동되어 있으면 그 권한으로 조회
  const client = (await getAuthenticatedYoutubeClient()) ?? youtube;

  do {
    const res = await wrap(
      client.commentThreads.list({
        part: ["snippet", "replies"],
        videoId,
        maxResults: 100,
        pageToken,
        textFormat: "plainText",
      }),
    );

    for (const thread of res.data.items ?? []) {
      const top = thread.snippet?.topLevelComment;
      const firstReply = thread.replies?.comments?.[0];

      // 대댓글이 하나도 없는 댓글은 수집하지 않음
      if (!firstReply?.id || !firstReply.snippet) continue;

      if (top?.id && top.snippet) {
        comments.push(toFetchedComment(top.id, null, top.snippet));
      }
      comments.push(toFetchedComment(firstReply.id, top?.id ?? null, firstReply.snippet));
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return comments;
}

function toFetchedComment(
  id: string,
  parentId: string | null,
  snippet: {
    authorDisplayName?: string | null;
    authorProfileImageUrl?: string | null;
    textOriginal?: string | null;
    textDisplay?: string | null;
    likeCount?: number | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
  },
): FetchedComment {
  return {
    id,
    parentId,
    authorName: snippet.authorDisplayName ?? "(알 수 없음)",
    authorProfileUrl: snippet.authorProfileImageUrl ?? null,
    // textOriginal은 댓글 작성자 본인만 조회 가능해 API 키로는 비어있을 수 있어 textDisplay로 보완
    textOriginal: snippet.textOriginal ?? snippet.textDisplay ?? "",
    likeCount: snippet.likeCount ?? 0,
    publishedAt: new Date(snippet.publishedAt ?? Date.now()),
    updatedAt: new Date(snippet.updatedAt ?? snippet.publishedAt ?? Date.now()),
  };
}

/** youtu.be, watch?v=, shorts/ URL과 순수 영상 ID를 모두 파싱 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/i,
  );
  if (urlMatch) return urlMatch[1];

  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

export interface VideoMeta {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
}

/** 영상 ID로 단일 영상 메타정보 조회 (멤버십 영상도 메타데이터는 API 키로 조회 가능) */
export async function fetchVideoById(videoId: string): Promise<VideoMeta> {
  const res = await wrap(youtube.videos.list({ part: ["snippet"], id: [videoId] }));
  const video = res.data.items?.[0];
  if (!video?.id || !video.snippet?.channelId) {
    throw new YoutubeApiError("영상을 찾을 수 없습니다.", 404);
  }

  return {
    id: video.id,
    title: video.snippet.title ?? video.id,
    thumbnailUrl:
      video.snippet.thumbnails?.medium?.url ?? video.snippet.thumbnails?.default?.url ?? null,
    publishedAt: new Date(video.snippet.publishedAt ?? Date.now()),
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle ?? video.snippet.channelId,
  };
}
