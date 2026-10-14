import { NextResponse } from "next/server";
import { collectComments } from "@/lib/collect";
import { YoutubeApiError } from "@/lib/youtube";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  try {
    const result = await collectComments(videoId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof YoutubeApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    throw err;
  }
}
