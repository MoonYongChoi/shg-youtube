import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommentTable } from "@/components/CommentTable";
import { ExportButton } from "@/components/ExportButton";
import { RecollectButton } from "@/components/RecollectButton";

export default async function VideoPage({
  params,
}: PageProps<"/videos/[videoId]">) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      comments: {
        include: { history: { orderBy: { capturedAt: "asc" } } },
        orderBy: { publishedAt: "asc" },
      },
    },
  });

  if (!video) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{video.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            댓글 {video.comments.length}개 · 마지막 수집:{" "}
            {video.lastScrapedAt ? video.lastScrapedAt.toLocaleString("ko-KR") : "없음"}
          </p>
        </div>
        <div className="flex gap-2">
          <RecollectButton videoId={video.id} />
          <ExportButton videoId={video.id} />
        </div>
      </div>

      <div className="mt-8">
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
    </div>
  );
}
