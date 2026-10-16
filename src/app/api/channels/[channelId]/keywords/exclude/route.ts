import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const body = await request.json().catch(() => null);
  const word = typeof body?.word === "string" ? body.word.trim() : "";

  if (!word) {
    return NextResponse.json({ error: "word는 필수입니다." }, { status: 400 });
  }

  await prisma.excludedKeyword.upsert({
    where: { channelId_word: { channelId, word } },
    update: {},
    create: { channelId, word },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const body = await request.json().catch(() => null);
  const word = typeof body?.word === "string" ? body.word.trim() : "";

  if (!word) {
    return NextResponse.json({ error: "word는 필수입니다." }, { status: 400 });
  }

  await prisma.excludedKeyword.delete({ where: { channelId_word: { channelId, word } } }).catch((err) => {
    if (err?.code === "P2025") return null;
    throw err;
  });

  return NextResponse.json({ ok: true });
}
