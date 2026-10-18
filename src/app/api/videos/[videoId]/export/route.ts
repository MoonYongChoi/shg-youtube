import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { videoThreadsToCsv } from "@/lib/csv";

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

  const csv = videoThreadsToCsv(comments);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comments-${videoId}.csv"`,
    },
  });
}
