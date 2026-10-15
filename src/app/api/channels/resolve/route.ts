import { NextRequest, NextResponse } from "next/server";
import { syncChannelVideos } from "@/lib/collect";
import { YoutubeApiError } from "@/lib/youtube";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const channelInput = body?.channelInput;

  if (typeof channelInput !== "string" || channelInput.trim().length === 0) {
    return NextResponse.json({ error: "channelInput이 필요합니다." }, { status: 400 });
  }

  try {
    const result = await syncChannelVideos(channelInput);
    return NextResponse.json({ channelId: result.channelId, videoCount: result.totalVideos });
  } catch (err) {
    if (err instanceof YoutubeApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    throw err;
  }
}
