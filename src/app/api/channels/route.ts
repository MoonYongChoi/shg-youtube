import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true } } },
  });

  return NextResponse.json(
    channels.map((c) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      videoCount: c._count.videos,
    })),
  );
}
