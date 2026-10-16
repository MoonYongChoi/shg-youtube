import { NextRequest, NextResponse } from "next/server";
import { getChannelCommentsFeed } from "@/lib/commentsFeed";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const page = Math.max(0, Number(request.nextUrl.searchParams.get("page") ?? "0") || 0);

  const result = await getChannelCommentsFeed(channelId, { q, page });
  return NextResponse.json(result);
}
