import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;

  await prisma.channel.delete({ where: { id: channelId } }).catch((err) => {
    if (err?.code === "P2025") return null; // 이미 없는 채널이면 조용히 성공 처리
    throw err;
  });

  return NextResponse.json({ ok: true });
}
