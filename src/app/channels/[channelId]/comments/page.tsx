import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getChannelCommentsFeed } from "@/lib/commentsFeed";
import { ChannelCommentsSearch } from "@/components/ChannelCommentsSearch";
import { ExportButton } from "@/components/ExportButton";
import { BackButton } from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function ChannelCommentsPage({
  params,
}: {
  params: Promise<{ channelId: string }>;
}) {
  const { channelId } = await params;

  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) notFound();

  const feed = await getChannelCommentsFeed(channelId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="min-w-0 truncate text-xl font-semibold sm:text-2xl">
          {channel.title} · 전체 댓글
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <ExportButton href={`/api/channels/${channel.id}/export`} />
          <Link
            href={`/channels/${channel.id}`}
            className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
          >
            영상 목록으로
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <ChannelCommentsSearch
          channelId={channel.id}
          initialItems={feed.items}
          initialHasMore={feed.hasMore}
          initialTotal={feed.total}
        />
      </div>
    </div>
  );
}
