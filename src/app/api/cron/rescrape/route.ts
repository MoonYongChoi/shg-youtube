import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectComments } from "@/lib/collect";

export const maxDuration = 300;

// 영상당 평균 15~20초(유튜브 API+DB) 기준으로 300초 안에 여유 있게 끝나는 배치 크기
const BATCH_SIZE = 25;
// 체이닝 무한 반복 방지용 안전장치 (배치당 25개면 최대 750개 영상까지 하루 안에 커버)
const MAX_BATCHES = 30;

/**
 * 모니터링 중인 영상 전체를 한 요청 안에서 순회하면 영상이 많아질수록 maxDuration(5분)을
 * 넘겨서 중간에 끊긴다. 그래서 한 번에 BATCH_SIZE만큼만 처리하고, 처리한 영상은 lastScrapedAt이
 * 막 갱신되니 다음 조회에선 자연스럽게 아직 안 처리된 영상이 먼저 걸린다. 더 처리할 영상이
 * 남아있으면 after()로 다음 배치를 체이닝해서(응답은 바로 보내고 백그라운드에서 이어감) 영상
 * 수와 무관하게 전체를 끝까지 처리한다.
 */
async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batch = Number(request.nextUrl.searchParams.get("batch") ?? "0");

  const videos = await prisma.video.findMany({
    where: { monitored: true },
    orderBy: { lastScrapedAt: { sort: "asc", nulls: "first" } },
    take: BATCH_SIZE,
  });

  const results = [];
  for (const video of videos) {
    try {
      results.push(await collectComments(video.id));
    } catch (err) {
      results.push({
        videoId: video.id,
        error: err instanceof Error ? err.message : "수집 실패",
      });
    }
  }

  if (videos.length === BATCH_SIZE && batch + 1 < MAX_BATCHES) {
    const nextUrl = new URL(request.nextUrl.pathname, request.nextUrl.origin);
    nextUrl.searchParams.set("batch", String(batch + 1));
    after(async () => {
      await fetch(nextUrl.toString(), {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {});
    });
  }

  return NextResponse.json({ batch, processed: videos.length, results });
}

export const GET = handle;
export const POST = handle;
