import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentsToCsv, type CommentCsvRow } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: { history: { orderBy: { capturedAt: "asc" } } },
    orderBy: { publishedAt: "asc" },
  });

  const rows: CommentCsvRow[] = [];
  for (const comment of comments) {
    rows.push({
      commentId: comment.id,
      parentId: comment.parentId,
      authorName: comment.authorName,
      textOriginal: comment.textOriginal,
      likeCount: comment.likeCount,
      publishedAt: comment.publishedAt,
      updatedAt: comment.updatedAt,
      isDeleted: comment.isDeleted,
      historyIndex: null,
      historyCapturedAt: null,
    });

    comment.history.forEach((h, idx) => {
      rows.push({
        commentId: comment.id,
        parentId: comment.parentId,
        authorName: comment.authorName,
        textOriginal: h.textOriginal,
        likeCount: h.likeCount,
        publishedAt: comment.publishedAt,
        updatedAt: h.updatedAt,
        isDeleted: false,
        historyIndex: idx + 1,
        historyCapturedAt: h.capturedAt,
      });
    });
  }

  const csv = commentsToCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comments-${videoId}.csv"`,
    },
  });
}
