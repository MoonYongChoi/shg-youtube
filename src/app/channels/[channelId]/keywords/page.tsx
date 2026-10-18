import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractKeywords } from "@/lib/keywords";
import { BackButton } from "@/components/BackButton";
import { ExcludeKeywordButton, RestoreKeywordButton } from "@/components/ExcludeKeywordButton";
import { RefreshButton } from "@/components/RefreshButton";

export const dynamic = "force-dynamic";

export default async function ChannelKeywordsPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) notFound();

  const [comments, excluded] = await Promise.all([
    prisma.comment.findMany({
      where: { video: { channelId }, isDeleted: false, parentId: null },
      select: { textOriginal: true },
    }),
    prisma.excludedKeyword.findMany({ where: { channelId }, orderBy: { createdAt: "desc" } }),
  ]);

  const excludeWords = new Set(excluded.map((e) => e.word));
  const keywords = extractKeywords(comments.map((c) => c.textOriginal), 50, excludeWords);
  const maxCount = keywords[0]?.count ?? 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold sm:text-2xl">
          {channel.title} · 키워드 분석
        </h1>
        <RefreshButton />
      </div>
      <p className="mt-2 text-sm text-stone-500">
        시청자 댓글 {comments.length}개에서 자주 등장한 단어 상위 {keywords.length}개입니다. 정식
        형태소 분석이 아니라 조사를 떼어내는 간단한 방식이라 참고용으로만 봐주세요.
      </p>

      {keywords.length === 0 ? (
        <p className="mt-8 text-sm text-stone-400">분석할 댓글이 없습니다.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-2">
          {keywords.map((k, i) => (
            <li key={k.word} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-right text-xs text-stone-400">{i + 1}</span>
              <span className="w-20 shrink-0 truncate text-sm font-medium sm:w-28">{k.word}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-stone-100">
                <div
                  className="h-full rounded bg-amber-300"
                  style={{ width: `${Math.max(4, (k.count / maxCount) * 100)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs text-stone-500">{k.count}</span>
              <ExcludeKeywordButton channelId={channel.id} word={k.word} />
            </li>
          ))}
        </ul>
      )}

      {excluded.length > 0 && (
        <div className="mt-10 border-t border-stone-200 pt-4">
          <h2 className="text-sm font-medium text-stone-500">제외된 키워드 ({excluded.length})</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {excluded.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600"
              >
                <span>{e.word}</span>
                <RestoreKeywordButton channelId={channel.id} word={e.word} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
