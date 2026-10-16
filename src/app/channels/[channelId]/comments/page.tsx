import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommentTable } from "@/components/CommentTable";

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
        <Link
          href={`/channels/${channel.id}`}
          className="shrink-0 rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
        >
          영상 목록으로
        </Link>
      </div>

      {videos.length === 0 ? (
        <p className="mt-8 text-sm text-stone-400">아직 수집된 댓글이 없습니다.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {videos.map((video) => (
            <div key={video.id}>
              <Link
                href={`/videos/${video.id}`}
                className="text-sm font-medium text-stone-600 hover:underline"
              >
                {video.title}
              </Link>
              <p className="mt-0.5 mb-3 text-xs text-stone-400">댓글 {video.comments.length}개</p>
              <CommentTable
                comments={video.comments.map((c) => ({
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
                }))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
