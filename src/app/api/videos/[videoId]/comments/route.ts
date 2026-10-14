import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  const comments = await prisma.comment.findMany({
    where: { videoId },
    include: { history: { orderBy: { capturedAt: "asc" } } },
    orderBy: { publishedAt: "asc" },
  });

  return NextResponse.json(comments);
}
