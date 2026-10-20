import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { collectComments } from "@/lib/collect";

export const maxDuration = 300;

const BATCH_SIZE = 25;
// 300초 제한 안에서 안전하게 끝낼 수 있는 만큼만 돌고, 넘으면 다음 배치를 체이닝한다.
// after()는 이 프로젝트에 Fluid Compute가 꺼져 있어서 응답을 보낸 뒤 오래 못 살기 때문에
// (실측해보니 몇 번 체이닝되다 중간에 끊김) 보통은 이 while 루프 안에서 전부 끝내고,
// 영상이 너무 많아져서 시간 안에 못 끝낼 때만 after()를 안전망으로 쓴다.
const TIME_BUDGET_MS = 250_000;

async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  type CollectOutcome = Awaited<ReturnType<typeof collectComments>> | { videoId: string; error: string };

  const start = Date.now();
  const results: CollectOutcome[] = [];
  let chained = false;

  // 모니터링 중인 영상이 BATCH_SIZE보다 많으면 배치는 항상 가득 차서 돌아오기 때문에,
  // "배치가 덜 찼으면 끝"이 아니라 처음에 센 전체 개수만큼 처리했는지로 종료를 판단해야 한다
  // (안 그러면 한 바퀴 다 돌고도 계속 같은 영상들을 재처리하며 무한 루프에 빠짐).
  const totalToProcess = await prisma.video.count({ where: { monitored: true } });
  // collectComments가 실패하면 lastScrapedAt이 안 갱신돼서 정렬상 계속 맨 앞에 남는다.
  // 그 상태로 lastScrapedAt asc만 믿으면 같은 실패 영상을 계속 다시 뽑아서 다른 영상으로
  // 못 넘어가니, 이번 실행에서 이미 시도한 id는 명시적으로 제외한다.
  const attemptedIds = new Set<string>();

  while (results.length < totalToProcess) {
    const videos = await prisma.video.findMany({
      where: { monitored: true, id: { notIn: [...attemptedIds] } },
      orderBy: { lastScrapedAt: { sort: "asc", nulls: "first" } },
      take: Math.min(BATCH_SIZE, totalToProcess - results.length),
    });

    if (videos.length === 0) break;

    for (const video of videos) {
      attemptedIds.add(video.id);
      try {
        results.push(await collectComments(video.id));
      } catch (err) {
        results.push({
          videoId: video.id,
          error: err instanceof Error ? err.message : "수집 실패",
        });
      }
    }

    if (results.length >= totalToProcess) break; // 전체 처리 완료

    if (Date.now() - start > TIME_BUDGET_MS) {
      const nextUrl = new URL(request.nextUrl.pathname, request.nextUrl.origin);
      after(async () => {
        await fetch(nextUrl.toString(), {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        }).catch(() => {});
      });
      chained = true;
      break;
    }
  }

  return NextResponse.json({ processed: results.length, chained, results });
}

export const GET = handle;
export const POST = handle;
