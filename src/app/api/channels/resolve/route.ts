import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelVideos, resolveChannel, YoutubeApiError } from "@/lib/youtube";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const channelInput = body?.channelInput;

  if (typeof channelInput !== "string" || channelInput.trim().length === 0) {
    return NextResponse.json({ error: "channelInput이 필요합니다." }, { status: 400 });
  }

  try {
    const channel = await resolveChannel(channelInput);
    const videos = await fetchChannelVideos(channel.uploadsPlaylistId);

    await prisma.channel.upsert({
      where: { id: channel.id },
      create: { id: channel.id, title: channel.title, handle: channel.handle },
      update: { title: channel.title, handle: channel.handle },
    });

    await Promise.all(
      videos.map((video) =>
        prisma.video.upsert({
          where: { id: video.id },
          create: {
            id: video.id,
            channelId: channel.id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            publishedAt: video.publishedAt,
          },
          update: {
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
          },
        }),
      ),
    );

    return NextResponse.json({ channelId: channel.id, videoCount: videos.length });
  } catch (err) {
    if (err instanceof YoutubeApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    throw err;
  }
}
