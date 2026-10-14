import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VideoSelectionTable } from "@/components/VideoSelectionTable";

export const instant = false;

export default async function ChannelPage({
  params,
}: PageProps<"/channels/[channelId]">) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { videos: { orderBy: { publishedAt: "desc" } } },
  });

  if (!channel) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{channel.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        멤버십 전용 영상을 체크하고 모니터링을 켜면 댓글 수집이 시작됩니다.
      </p>

      <div className="mt-8">
        <VideoSelectionTable
          videos={channel.videos.map((v) => ({
            id: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            publishedAt: v.publishedAt.toISOString(),
            isMembersOnly: v.isMembersOnly,
            monitored: v.monitored,
            lastScrapedAt: v.lastScrapedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
