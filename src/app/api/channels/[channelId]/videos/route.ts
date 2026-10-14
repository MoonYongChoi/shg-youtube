import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/channels/[channelId]/videos">,
) {
  const { channelId } = await ctx.params;

  const videos = await prisma.video.findMany({
    where: { channelId },
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  return NextResponse.json(
    videos.map((v) => ({
      id: v.id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      publishedAt: v.publishedAt,
      isMembersOnly: v.isMembersOnly,
      monitored: v.monitored,
      lastScrapedAt: v.lastScrapedAt,
      commentCount: v._count.comments,
    })),
  );
}
