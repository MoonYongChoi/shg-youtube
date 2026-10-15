import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncChannelVideos } from "@/lib/collect";
import { VideoSelectionTable } from "@/components/VideoSelectionTable";
import { AddVideoForm } from "@/components/AddVideoForm";
import { DeleteChannelButton } from "@/components/DeleteChannelButton";
import { RefreshVideosButton } from "@/components/RefreshVideosButton";

export const dynamic = "force-dynamic";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  // 페이지 방문 시마다 채널에 새로 올라온 영상이 있는지 가볍게 확인 (이미 아는 영상만 있으면 1페이지만 보고 끝남)
  try {
    await syncChannelVideos(channelId);
  } catch {
    // 동기화 실패해도 기존에 저장된 목록은 그대로 보여준다
  }

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      videos: {
        orderBy: { publishedAt: "desc" },
        include: { _count: { select: { comments: true } } },
      },
    },
  });

  if (!channel) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold sm:text-2xl">{channel.title}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <RefreshVideosButton channelId={channel.id} />
          <DeleteChannelButton channelId={channel.id} channelTitle={channel.title} redirectTo="/" />
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        멤버십 전용 영상을 체크하고 모니터링을 켜면 댓글 수집이 시작됩니다.
      </p>

      <AddVideoForm />

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
            commentCount: v._count.comments,
          }))}
        />
      </div>
    </div>
  );
}
