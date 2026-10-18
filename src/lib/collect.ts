import { prisma } from "@/lib/prisma";
import { fetchAllComments, fetchChannelVideos, resolveChannel } from "@/lib/youtube";

export interface CollectResult {
  videoId: string;
  fetched: number;
  created: number;
  updated: number;
  deleted: number;
}

/**
 * 영상의 현재 댓글을 수집해 DB와 diff한다.
 * 텍스트/좋아요수가 바뀐 댓글은 이전 값을 CommentHistory에 적재한 뒤 갱신하고,
 * 이번 응답에 없는 기존 댓글은 isDeleted로 표시한다.
 */
export async function collectComments(videoId: string): Promise<CollectResult> {
  const rawFetched = await fetchAllComments(videoId);
  // commentThreads.list 페이지 경계에서 같은 스레드가 두 페이지에 걸쳐 중복으로 올 때가 있어
  // id 기준으로 한 번 더 중복 제거한다 (안 하면 같은 id로 create를 두 번 시도해 unique 제약 위반 발생)
  const fetched = [...new Map(rawFetched.map((c) => [c.id, c])).values()];
  const existing = await prisma.comment.findMany({ where: { videoId } });
  const existingById = new Map(existing.map((c) => [c.id, c]));
  const fetchedIds = new Set(fetched.map((c) => c.id));

  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const comment of fetched) {
    const prev = existingById.get(comment.id);

    if (!prev) {
      // id는 전역 유니크라서, 혹시 디듑 후에도 다른 영상에 같은 id가 이미 있으면 create가 깨질 수
      // 있으니 upsert로 방어한다 (해당 id가 이 영상 소속이 아니었을 가능성은 거의 없지만 전체 배치가
      // 하나의 예외로 통째로 죽는 것보다는 안전함)
      await prisma.comment.upsert({
        where: { id: comment.id },
        create: {
          id: comment.id,
          videoId,
          parentId: comment.parentId,
          authorName: comment.authorName,
          authorProfileUrl: comment.authorProfileUrl,
          textOriginal: comment.textOriginal,
          likeCount: comment.likeCount,
          publishedAt: comment.publishedAt,
          updatedAt: comment.updatedAt,
        },
        update: {
          textOriginal: comment.textOriginal,
          likeCount: comment.likeCount,
          updatedAt: comment.updatedAt,
          isDeleted: false,
          deletedAt: null,
        },
      });
      created++;
      continue;
    }

    const changed =
      prev.textOriginal !== comment.textOriginal ||
      prev.updatedAt.getTime() !== comment.updatedAt.getTime();

    if (changed) {
      await prisma.commentHistory.create({
        data: {
          commentId: prev.id,
          textOriginal: prev.textOriginal,
          likeCount: prev.likeCount,
          updatedAt: prev.updatedAt,
        },
      });
    }

    if (changed || prev.likeCount !== comment.likeCount || prev.isDeleted) {
      await prisma.comment.update({
        where: { id: prev.id },
        data: {
          textOriginal: comment.textOriginal,
          likeCount: comment.likeCount,
          updatedAt: comment.updatedAt,
          isDeleted: false,
          deletedAt: null,
        },
      });
      updated++;
    }
  }

  const removed = existing.filter((c) => !c.isDeleted && !fetchedIds.has(c.id));
  if (removed.length > 0) {
    await prisma.comment.updateMany({
      where: { id: { in: removed.map((c) => c.id) } },
      data: { isDeleted: true, deletedAt: new Date() },
    });
    deleted = removed.length;
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { lastScrapedAt: new Date() },
  });

  return { videoId, fetched: fetched.length, created, updated, deleted };
}

export interface SyncChannelResult {
  channelId: string;
  totalVideos: number;
  newVideos: number;
}

/**
 * 채널의 uploads 재생목록을 다시 조회해 새로 올라온 영상이 있으면 DB에 추가한다.
 * channelInput은 채널ID, 핸들(@xxx), 전체 URL 중 어떤 형태든 가능하다.
 */
export async function syncChannelVideos(channelInput: string): Promise<SyncChannelResult> {
  const channel = await resolveChannel(channelInput);

  const existing = await prisma.video.findMany({
    where: { channelId: channel.id },
    select: { id: true },
  });
  const knownIds = new Set(existing.map((v) => v.id));

  const videos = await fetchChannelVideos(channel.uploadsPlaylistId, knownIds);

  await prisma.channel.upsert({
    where: { id: channel.id },
    create: { id: channel.id, title: channel.title, handle: channel.handle },
    update: { title: channel.title, handle: channel.handle },
  });

  await Promise.all(
    videos.map((video) =>
      prisma.video.upsert({
        where: { id: video.id },
        create: {
          id: video.id,
          channelId: channel.id,
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          publishedAt: video.publishedAt,
        },
        update: {
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
        },
      }),
    ),
  );

  const newVideos = videos.filter((v) => !knownIds.has(v.id)).length;
  return { channelId: channel.id, totalVideos: videos.length, newVideos };
}
