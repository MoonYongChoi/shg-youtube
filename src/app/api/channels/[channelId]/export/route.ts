import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { channelThreadsToCsv } from "@/lib/csv";

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

  const csv = channelThreadsToCsv(videos);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="comments-${channelId}.csv"`,
    },
  });
}
