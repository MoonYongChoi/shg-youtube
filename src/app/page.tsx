import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChannelForm } from "@/components/ChannelForm";
import { GoogleConnectButton } from "@/components/GoogleConnectButton";
import { DeleteChannelButton } from "@/components/DeleteChannelButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { videos: true } },
      videos: { select: { lastScrapedAt: true } },
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
      <h1 className="text-xl font-semibold sm:text-2xl">유튜브 멤버십 댓글 수집기</h1>
      <p className="mt-2 text-sm text-stone-500">
        채널 URL이나 핸들(@채널명)을 입력하면 해당 채널의 영상 목록을 가져옵니다.
      </p>

      <div className="mt-4">
        <GoogleConnectButton />
      </div>

      <div className="mt-8">
        <ChannelForm />
      </div>

      <div className="mt-12">
        <h2 className="text-sm font-medium text-stone-500">등록된 채널</h2>
        {channels.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">아직 등록된 채널이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {channels.map((c) => {
              const lastCollectedAt = c.videos.reduce<Date | null>((max, v) => {
                if (!v.lastScrapedAt) return max;
                return !max || v.lastScrapedAt > max ? v.lastScrapedAt : max;
              }, null);

              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-3 hover:bg-stone-50"
                >
                  <Link href={`/channels/${c.id}`} className="min-w-0 flex-1">
                    <span className="truncate font-medium">{c.title}</span>
                    <p className="mt-0.5 text-xs text-stone-400">
                      마지막 수집: {lastCollectedAt ? lastCollectedAt.toLocaleString("ko-KR") : "없음"}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm text-stone-500">{c._count.videos}개 영상</span>
                    <DeleteChannelButton channelId={c.id} channelTitle={c.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
