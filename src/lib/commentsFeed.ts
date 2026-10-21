import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const COMMENTS_PAGE_SIZE = 30;

export interface CommentFeedItem {
  id: string;
  parentId: string | null;
  authorName: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  isDeleted: boolean;
  history: { textOriginal: string; likeCount: number; capturedAt: string }[];
  videoId: string;
  videoTitle: string;
}

export interface CommentsFeedResult {
  items: CommentFeedItem[];
  hasMore: boolean;
  total: number;
}

const commentInclude = {
  history: { orderBy: { capturedAt: "asc" as const } },
  video: { select: { id: true, title: true } },
} satisfies Prisma.CommentInclude;

type CommentWithExtras = Prisma.CommentGetPayload<{ include: typeof commentInclude }>;

function toFeedItems(rows: CommentWithExtras[]): CommentFeedItem[] {
  return rows.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    authorName: c.authorName,
    textOriginal: c.textOriginal,
    likeCount: c.likeCount,
    publishedAt: c.publishedAt.toISOString(),
    isDeleted: c.isDeleted,
    history: c.history.map((h) => ({
      textOriginal: h.textOriginal,
      likeCount: h.likeCount,
      capturedAt: h.capturedAt.toISOString(),
    })),
    videoId: c.video.id,
    videoTitle: c.video.title,
  }));
}

/** 주어진 순서의 스레드 루트 id들에 대해 본댓글+대댓글을 전부 가져와 루트 순서대로 정렬해 돌려준다 */
async function fetchThreadsInOrder(rootIds: string[]): Promise<CommentFeedItem[]> {
  if (rootIds.length === 0) return [];

  const rows = await prisma.comment.findMany({
    where: { OR: [{ id: { in: rootIds } }, { parentId: { in: rootIds } }] },
    include: commentInclude,
  });

  const rootOrder = new Map(rootIds.map((id, i) => [id, i]));
  rows.sort((a, b) => {
    const ra = rootOrder.get(a.parentId ?? a.id) ?? 0;
    const rb = rootOrder.get(b.parentId ?? b.id) ?? 0;
    if (ra !== rb) return ra - rb;
    return (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0); // 같은 스레드면 본댓글 먼저
  });

  return toFeedItems(rows);
}

/**
 * 채널의 댓글을 "원 댓글(본댓글) 작성일" 기준 최신순으로 페이지 단위로 가져온다.
 * q가 있으면 본문/작성자에서 검색하되, 본댓글/대댓글 둘 중 하나라도 매치되면
 * 그 스레드(본댓글+대댓글) 전체를 같이 보여준다.
 * 13000개가 넘는 댓글을 한 번에 다 내려보내면 스크롤/렌더링/필터링이 전부 느려져서,
 * DB에서 바로 페이지네이션+검색까지 처리하고 결과만 내려보낸다.
 */
export async function getChannelCommentsFeed(
  channelId: string,
  { q = "", page = 0 }: { q?: string; page?: number } = {},
): Promise<CommentsFeedResult> {
  const query = q.trim();

  if (!query) {
    // 대댓글이 아무리 늦게 달려도 정렬 기준은 본댓글(스레드 루트) 작성일이어야 하므로,
    // 본댓글만 최신순으로 페이지네이션한 뒤 그 스레드들의 대댓글을 같이 가져온다.
    const whereRoot = { video: { channelId }, isDeleted: false, parentId: null };
    const [roots, total] = await Promise.all([
      prisma.comment.findMany({
        where: whereRoot,
        orderBy: { publishedAt: "desc" },
        skip: page * COMMENTS_PAGE_SIZE,
        take: COMMENTS_PAGE_SIZE,
        select: { id: true },
      }),
      prisma.comment.count({ where: whereRoot }),
    ]);

    return {
      items: await fetchThreadsInOrder(roots.map((r) => r.id)),
      hasMore: (page + 1) * COMMENTS_PAGE_SIZE < total,
      total,
    };
  }

  // 1단계: 본문/작성자/영상 제목에 매치되는 댓글(본댓글이든 대댓글이든) 전부 찾는다
  const matches = await prisma.comment.findMany({
    where: {
      video: { channelId },
      isDeleted: false,
      OR: [
        { textOriginal: { contains: query, mode: "insensitive" } },
        { authorName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, parentId: true },
  });

  if (matches.length === 0) {
    return { items: [], hasMore: false, total: 0 };
  }

  // 2단계: 매치된 댓글이 대댓글이면 본댓글 id를, 본댓글이면 자기 id를 "스레드 루트"로 묶는다.
  // 정렬은 검색 매치 여부와 무관하게 항상 본댓글(스레드 루트) 작성일 기준.
  const rootIds = [...new Set(matches.map((m) => m.parentId ?? m.id))];
  const rootComments = await prisma.comment.findMany({
    where: { id: { in: rootIds } },
    select: { id: true, publishedAt: true },
  });
  const sortedRootIds = rootComments
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .map((r) => r.id);

  const total = sortedRootIds.length;
  const pageRootIds = sortedRootIds.slice(
    page * COMMENTS_PAGE_SIZE,
    (page + 1) * COMMENTS_PAGE_SIZE,
  );

  return {
    items: await fetchThreadsInOrder(pageRootIds),
    hasMore: (page + 1) * COMMENTS_PAGE_SIZE < total,
    total,
  };
}
