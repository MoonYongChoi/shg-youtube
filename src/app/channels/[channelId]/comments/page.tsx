import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChannelCommentsSearch } from "@/components/ChannelCommentsSearch";
import { ExportButton } from "@/components/ExportButton";

export const dynamic = "force-dynamic";

export default async function ChannelCommentsPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) notFound();

  const videos = await prisma.video.findMany({
    where: { channelId, comments: { some: {} } },
    orderBy: { publishedAt: "desc" },
    include: {
      comments: {
        include: { history: { orderBy: { capturedAt: "asc" } } },
        orderBy: { publishedAt: "asc" },
      },
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
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
          videos={videos.map((video) => ({
            id: video.id,
            title: video.title,
            comments: video.comments.map((c) => ({
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
            })),
          }))}
        />
      </div>
    </div>
  );
}
