import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VideoSelectionTable } from "@/components/VideoSelectionTable";
import { AddVideoForm } from "@/components/AddVideoForm";
import { DeleteChannelButton } from "@/components/DeleteChannelButton";
import { RecollectAllButton } from "@/components/RecollectAllButton";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

// 채널 등록 시 가져온 공개 영상 500개를 매번 재확인하는 건 지금 쓰임새(멤버십 영상만 수동 추가)와
// 안 맞아서 당분간 꺼둠. 되살리려면 여기서 syncChannelVideos(channelId)를 다시 호출하고
// RefreshVideosButton을 헤더에 추가하면 됨.

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      videos: {
        orderBy: { publishedAt: "desc" },
        include: { _count: { select: { comments: { where: { isDeleted: false } } } } },
      },
    },
  });

  if (!channel) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold sm:text-2xl">{channel.title}</h1>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <RecollectAllButton channelId={channel.id} />
          <Link
            href={`/channels/${channel.id}/comments`}
            className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
          >
            댓글만 모아보기
          </Link>
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
