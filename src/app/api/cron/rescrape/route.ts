import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectComments } from "@/lib/collect";

export const maxDuration = 300;

async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await prisma.video.findMany({ where: { monitored: true } });
  const results = [];

  for (const video of videos) {
    try {
      results.push(await collectComments(video.id));
    } catch (err) {
      results.push({
        videoId: video.id,
        error: err instanceof Error ? err.message : "수집 실패",
      });
    }
  }

  return NextResponse.json({ processed: videos.length, results });
}

export const GET = handle;
export const POST = handle;
