import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectComments } from "@/lib/collect";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;

  const videos = await prisma.video.findMany({
    where: { channelId, monitored: true },
    select: { id: true },
  });

  let succeeded = 0;
  const errors: { videoId: string; message: string }[] = [];

  for (const video of videos) {
    try {
      await collectComments(video.id);
      succeeded++;
    } catch (err) {
      errors.push({
        videoId: video.id,
        message: err instanceof Error ? err.message : "수집 실패",
      });
    }
  }

  return NextResponse.json({ total: videos.length, succeeded, errors });
}
