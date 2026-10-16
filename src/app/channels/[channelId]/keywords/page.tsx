import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { extractKeywords } from "@/lib/keywords";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function ChannelKeywordsPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) notFound();

  const comments = await prisma.comment.findMany({
    where: { video: { channelId }, isDeleted: false, parentId: null },
    select: { textOriginal: true },
  });

  const keywords = extractKeywords(comments.map((c) => c.textOriginal));
  const maxCount = keywords[0]?.count ?? 1;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <h1 className="text-xl font-semibold sm:text-2xl">{channel.title} · 키워드 분석</h1>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
