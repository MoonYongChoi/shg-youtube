import { NextResponse } from "next/server";
import { getKeywordFrequencies } from "@/lib/keywordCache";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const result = await getKeywordFrequencies(channelId, true);
  return NextResponse.json({ ok: true, commentCount: result.commentCount });
}
