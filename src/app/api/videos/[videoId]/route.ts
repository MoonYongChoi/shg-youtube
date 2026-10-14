import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectComments } from "@/lib/collect";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || (body.isMembersOnly === undefined && body.monitored === undefined)) {
    return NextResponse.json(
      { error: "isMembersOnly 또는 monitored 중 하나는 필요합니다." },
      { status: 400 },
    );
  }

  const data: { isMembersOnly?: boolean; monitored?: boolean } = {};
  if (typeof body.isMembersOnly === "boolean") data.isMembersOnly = body.isMembersOnly;
  if (typeof body.monitored === "boolean") data.monitored = body.monitored;

  let video = await prisma.video.update({ where: { id: videoId }, data });

  if (data.monitored === true) {
    try {
      await collectComments(videoId);
      video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });
    } catch (err) {
      return NextResponse.json({
        video,
        collectError: err instanceof Error ? err.message : "댓글 수집 중 오류가 발생했습니다.",
      });
    }
  }

  return NextResponse.json({ video });
}
