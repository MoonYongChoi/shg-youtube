import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CommentTable } from "@/components/CommentTable";
import { ExportButton } from "@/components/ExportButton";
import { RecollectButton } from "@/components/RecollectButton";
import { BackButton } from "@/components/BackButton";
import { formatKST } from "@/lib/date";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: {
      comments: {
        where: { isDeleted: false },
        include: { history: { orderBy: { capturedAt: "asc" } } },
        orderBy: { publishedAt: "asc" },
      },
    },
  });

  if (!video) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">{video.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            댓글 {video.comments.length}개 · 마지막 수집:{" "}
            {video.lastScrapedAt ? formatKST(video.lastScrapedAt) : "없음"}
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
