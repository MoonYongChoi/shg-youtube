import { prisma } from "@/lib/prisma";

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

/**
 * 채널의 댓글을 최신순으로 페이지 단위로 가져온다. q가 있으면 본문/작성자/영상 제목에서 검색.
 * 4000개가 넘는 댓글을 한 번에 다 내려보내면 스크롤/렌더링/필터링이 전부 느려져서,
 * DB에서 바로 페이지네이션+검색까지 처리하고 결과만 내려보낸다.
 */
export async function getChannelCommentsFeed(
  channelId: string,
  { q = "", page = 0 }: { q?: string; page?: number } = {},
): Promise<CommentsFeedResult> {
  const query = q.trim();

  const where = {
    video: { channelId },
    isDeleted: false,
    ...(query
      ? {
          OR: [
            { textOriginal: { contains: query, mode: "insensitive" as const } },
            { authorName: { contains: query, mode: "insensitive" as const } },
            { video: { title: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: page * COMMENTS_PAGE_SIZE,
      take: COMMENTS_PAGE_SIZE,
      include: {
        history: { orderBy: { capturedAt: "asc" } },
        video: { select: { id: true, title: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    items: rows.map((c) => ({
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
    })),
    hasMore: (page + 1) * COMMENTS_PAGE_SIZE < total,
    total,
  };
}
