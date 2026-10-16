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

function Checkbox({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center justify-center p-2">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-6 w-6 cursor-pointer accent-stone-800 sm:h-5 sm:w-5"
      />
    </label>
  );
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
    <>
      {/* 모바일: 카드 목록 (좁은 화면에서 표가 넘치는 걸 방지) */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {rows.map((v) => (
          <li key={v.id} className="rounded-xl border border-stone-200 p-3">
            <Link href={`/videos/${v.id}`} className="font-medium hover:underline">
              {v.title}
            </Link>
            <p className="mt-1 text-xs text-stone-500">
              {new Date(v.publishedAt).toLocaleDateString("ko-KR")} · 댓글 {v.commentCount}개
            </p>
            <div className="mt-3 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <Checkbox
                  checked={v.isMembersOnly}
                  disabled={pending === v.id}
                  onChange={(checked) => updateVideo(v.id, { isMembersOnly: checked })}
                />
                <span className="text-stone-600">회원전용</span>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox
                  checked={v.monitored}
                  disabled={pending === v.id}
                  onChange={(checked) => updateVideo(v.id, { monitored: checked })}
                />
                <span className="text-stone-600">모니터링</span>
                {pending === v.id && (
                  <span
                    className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600"
                    title="댓글 수집 중..."
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* PC: 표 */}
      <table className="hidden w-full table-fixed text-sm sm:table">
        <colgroup>
          <col className="w-auto" />
          <col className="w-28" />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-16" />
        </colgroup>
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2 pr-4">영상</th>
            <th className="py-2 pr-4">게시일</th>
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
              <td className="py-3 pr-4 text-stone-500">
                {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="py-3 pr-4 text-center">
                <Checkbox
                  checked={v.isMembersOnly}
                  disabled={pending === v.id}
                  onChange={(checked) => updateVideo(v.id, { isMembersOnly: checked })}
                />
              </td>
              <td className="py-3 pr-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Checkbox
                    checked={v.monitored}
                    disabled={pending === v.id}
                    onChange={(checked) => updateVideo(v.id, { monitored: checked })}
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
    </>
  );
}
