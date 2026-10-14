import { NextResponse } from "next/server";
import { collectComments } from "@/lib/collect";
import { YoutubeApiError } from "@/lib/youtube";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/videos/[videoId]/collect">,
) {
  const { videoId } = await ctx.params;

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
