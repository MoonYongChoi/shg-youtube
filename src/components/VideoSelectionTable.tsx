"use client";

import Link from "next/link";
import { useState } from "react";

interface VideoRow {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  isMembersOnly: boolean;
  monitored: boolean;
  lastScrapedAt: string | null;
  commentCount: number;
}

export function VideoSelectionTable({ videos }: { videos: VideoRow[] }) {
  const [rows, setRows] = useState(videos);
  const [pending, setPending] = useState<string | null>(null);

  async function updateVideo(id: string, patch: { isMembersOnly?: boolean; monitored?: boolean }) {
    setPending(id);
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) {
        setRows((prev) =>
          prev.map((v) =>
            v.id === id
              ? {
                  ...v,
                  isMembersOnly: data.video.isMembersOnly,
                  monitored: data.video.monitored,
                  lastScrapedAt: data.video.lastScrapedAt ?? v.lastScrapedAt,
                }
              : v,
          ),
        );
        if (data.collectError) {
          alert(`댓글 수집 중 오류: ${data.collectError}`);
        }
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] table-fixed text-sm">
        <colgroup>
          <col className="w-auto" />
          <col className="hidden w-28 sm:table-column" />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-16" />
        </colgroup>
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2 pr-4">영상</th>
            <th className="hidden py-2 pr-4 sm:table-cell">게시일</th>
            <th className="py-2 pr-4 text-center">회원전용</th>
            <th className="py-2 pr-4 text-center">모니터링</th>
            <th className="py-2 text-right">댓글 수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-b border-stone-100">
              <td className="truncate py-3 pr-4">
                <Link href={`/videos/${v.id}`} className="hover:underline">
                  {v.title}
                </Link>
              </td>
              <td className="hidden py-3 pr-4 text-stone-500 sm:table-cell">
                {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="py-3 pr-4 text-center">
                <input
                  type="checkbox"
                  checked={v.isMembersOnly}
                  disabled={pending === v.id}
                  onChange={(e) => updateVideo(v.id, { isMembersOnly: e.target.checked })}
                />
              </td>
              <td className="py-3 pr-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    checked={v.monitored}
                    disabled={pending === v.id}
                    onChange={(e) => updateVideo(v.id, { monitored: e.target.checked })}
                  />
                  {pending === v.id && (
                    <span
                      className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600"
                      title="댓글 수집 중..."
                    />
                  )}
                </div>
              </td>
              <td className="py-3 text-right text-stone-500">{v.commentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
