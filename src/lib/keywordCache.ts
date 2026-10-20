import { prisma } from "@/lib/prisma";
import { computeWordFrequencies } from "@/lib/keywords";

export interface KeywordFrequencyResult {
  frequencies: Record<string, number>;
  commentCount: number;
  updatedAt: Date;
}

/**
 * 채널의 댓글 전체를 다시 훑는 건 무거운 작업(현재 1만8천+ 댓글)이라 결과를 DB에 캐싱해둔다.
 * forceRefresh가 아니면 캐시가 있을 때 그걸 그대로 쓰고, 없거나 강제 새로고침이면 다시 계산해 저장한다.
 */
export async function getKeywordFrequencies(
  channelId: string,
  forceRefresh = false,
): Promise<KeywordFrequencyResult> {
  if (!forceRefresh) {
    const cached = await prisma.keywordCache.findUnique({ where: { channelId } });
    if (cached) {
      return {
        frequencies: cached.frequencies as Record<string, number>,
        commentCount: cached.commentCount,
        updatedAt: cached.updatedAt,
      };
    }
  }

  const comments = await prisma.comment.findMany({
    where: { video: { channelId }, isDeleted: false, parentId: null },
    select: { textOriginal: true },
  });
  const frequencies = computeWordFrequencies(comments.map((c) => c.textOriginal));

  const saved = await prisma.keywordCache.upsert({
    where: { channelId },
    create: { channelId, frequencies, commentCount: comments.length },
    update: { frequencies, commentCount: comments.length },
  });

  return {
    frequencies: saved.frequencies as Record<string, number>,
    commentCount: saved.commentCount,
    updatedAt: saved.updatedAt,
  };
}
