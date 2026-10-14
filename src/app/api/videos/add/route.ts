import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractVideoId, fetchVideoById, YoutubeApiError } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const videoInput = body?.videoInput;

  if (typeof videoInput !== "string" || videoInput.trim().length === 0) {
    return NextResponse.json({ error: "videoInput이 필요합니다." }, { status: 400 });
  }

  const videoId = extractVideoId(videoInput);
  if (!videoId) {
    return NextResponse.json({ error: "영상 URL/ID를 인식하지 못했습니다." }, { status: 400 });
  }

  try {
    const meta = await fetchVideoById(videoId);

    await prisma.channel.upsert({
      where: { id: meta.channelId },
      create: { id: meta.channelId, title: meta.channelTitle },
      update: { title: meta.channelTitle },
    });

    const video = await prisma.video.upsert({
      where: { id: meta.id },
      create: {
        id: meta.id,
        channelId: meta.channelId,
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        publishedAt: meta.publishedAt,
        isMembersOnly: true,
      },
      update: {
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
      },
    });

    return NextResponse.json({ video });
  } catch (err) {
    if (err instanceof YoutubeApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    throw err;
  }
}
