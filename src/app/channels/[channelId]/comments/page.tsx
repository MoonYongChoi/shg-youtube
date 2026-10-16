import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChannelCommentsSearch } from "@/components/ChannelCommentsSearch";
import { ExportButton } from "@/components/ExportButton";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function ChannelCommentsPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) notFound();

  const comments = await prisma.comment.findMany({
    where: { video: { channelId }, isDeleted: false },
    include: {
      history: { orderBy: { capturedAt: "asc" } },
      video: { select: { id: true, title: true } },
    },
  });

  // 스레드(본댓글+대댓글) 단위로 최신순 정렬 — 대댓글은 본댓글 발행 시각 기준으로 묶임
  const byId = new Map(comments.map((c) => [c.id, c]));
  const threadTime = (c: (typeof comments)[number]) => {
    const top = c.parentId ? byId.get(c.parentId) : undefined;
    return (top ?? c).publishedAt.getTime();
  };
  const sorted = [...comments].sort((a, b) => {
    const diff = threadTime(b) - threadTime(a);
    if (diff !== 0) return diff;
    return (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0); // 같은 스레드면 본댓글 먼저
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold sm:text-2xl">
          {channel.title} · 전체 댓글
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton href={`/api/channels/${channel.id}/export`} />
          <Link
            href={`/channels/${channel.id}`}
            className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
          >
            영상 목록으로
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <ChannelCommentsSearch
          comments={sorted.map((c) => ({
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
          }))}
        />
      </div>
    </div>
  );
}
