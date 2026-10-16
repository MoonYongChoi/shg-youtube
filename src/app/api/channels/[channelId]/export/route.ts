import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { commentsToCsv, type CommentCsvRow } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;

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

  const rows: CommentCsvRow[] = [];
  for (const video of videos) {
    for (const comment of video.comments) {
      rows.push({
        videoId: video.id,
        videoTitle: video.title,
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
          videoId: video.id,
          videoTitle: video.title,
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
  }

  const csv = commentsToCsv(rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comments-${channelId}.csv"`,
    },
  });
}
