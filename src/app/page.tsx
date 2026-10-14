import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ChannelForm } from "@/components/ChannelForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { videos: true } } },
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">유튜브 멤버십 댓글 수집기</h1>
      <p className="mt-2 text-sm text-zinc-500">
        채널 URL이나 핸들(@채널명)을 입력하면 해당 채널의 영상 목록을 가져옵니다.
      </p>

      <div className="mt-8">
        <ChannelForm />
      </div>

      <div className="mt-12">
        <h2 className="text-sm font-medium text-zinc-500">등록된 채널</h2>
        {channels.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-400">아직 등록된 채널이 없습니다.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200">
            {channels.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/channels/${c.id}`}
                  className="flex items-center justify-between py-3 hover:bg-zinc-50"
                >
                  <span className="font-medium">{c.title}</span>
                  <span className="text-sm text-zinc-500">{c._count.videos}개 영상</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
