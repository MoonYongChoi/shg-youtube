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
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-zinc-200 text-left text-zinc-500">
          <th className="py-2">영상</th>
          <th className="py-2">게시일</th>
          <th className="py-2">회원전용</th>
          <th className="py-2">모니터링</th>
          <th className="py-2">댓글</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => (
          <tr key={v.id} className="border-b border-zinc-100">
            <td className="py-2">
              <Link href={`/videos/${v.id}`} className="hover:underline">
                {v.title}
              </Link>
            </td>
            <td className="py-2 text-zinc-500">
              {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
            </td>
            <td className="py-2">
              <input
                type="checkbox"
                checked={v.isMembersOnly}
                disabled={pending === v.id}
                onChange={(e) => updateVideo(v.id, { isMembersOnly: e.target.checked })}
              />
            </td>
            <td className="py-2">
              <input
                type="checkbox"
                checked={v.monitored}
                disabled={pending === v.id}
                onChange={(e) => updateVideo(v.id, { monitored: e.target.checked })}
              />
            </td>
            <td className="py-2 text-zinc-500">
              {v.lastScrapedAt ? "수집됨" : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
