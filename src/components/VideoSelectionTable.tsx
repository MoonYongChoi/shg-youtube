"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function MembersOnlyBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      title="회원전용 영상"
      className="inline-flex shrink-0 items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800"
    >
      🔒 회원전용
    </span>
  );
}

export function VideoSelectionTable({ videos }: { videos: VideoRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(videos);
  const [pending, setPending] = useState<string | null>(null);

  // 수집/삭제 후 router.refresh()로 서버에서 다시 받아온 최신 댓글 수 등을 로컬 상태에 반영
  useEffect(() => {
    setRows(videos);
  }, [videos]);

  async function updateVideo(id: string, patch: { monitored?: boolean }) {
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
                  monitored: data.video.monitored,
                  lastScrapedAt: data.video.lastScrapedAt ?? v.lastScrapedAt,
                }
              : v,
          ),
        );
        if (data.collectError) {
          alert(`댓글 수집 중 오류: ${data.collectError}`);
        }
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  async function deleteVideo(id: string, title: string) {
    if (!confirm(`"${title}" 영상과 수집된 댓글을 삭제할까요?`)) return;
    setPending(id);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((v) => v.id !== id));
      router.refresh();
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
            <div className="flex items-start justify-between gap-2">
              <Link href={`/videos/${v.id}`} className="flex min-w-0 items-center gap-2">
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="h-9 w-16 shrink-0 rounded object-cover"
                  />
                )}
                <span className="min-w-0 truncate font-medium hover:underline">{v.title}</span>
              </Link>
              <button
                onClick={() => deleteVideo(v.id, v.title)}
                disabled={pending === v.id}
                className="shrink-0 text-xs text-red-600 underline disabled:opacity-50"
              >
                삭제
              </button>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <MembersOnlyBadge show={v.isMembersOnly} />
              <p className="text-xs text-stone-500">
                {new Date(v.publishedAt).toLocaleDateString("ko-KR")} · 댓글 {v.commentCount}개
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm">
              <Checkbox
                checked={v.monitored}
                disabled={pending === v.id}
                onChange={(checked) => updateVideo(v.id, { monitored: checked })}
              />
              <span className="text-stone-600">모니터링</span>
              {pending === v.id && (
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600"
                  title="처리 중..."
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* PC: 표 */}
      <table className="hidden w-full table-fixed text-sm sm:table">
        <colgroup>
          <col className="w-auto" />
          <col className="w-28" />
          <col className="w-24" />
          <col className="w-16" />
          <col className="w-14" />
        </colgroup>
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2 pr-4">영상</th>
            <th className="py-2 pr-4">게시일</th>
            <th className="py-2 pr-4 text-center">모니터링</th>
            <th className="py-2 pr-4 text-right">댓글 수</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} className="border-b border-stone-100">
              <td className="py-3 pr-4">
                <Link href={`/videos/${v.id}`} className="flex items-center gap-2">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="h-9 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <MembersOnlyBadge show={v.isMembersOnly} />
                  <span className="truncate hover:underline">{v.title}</span>
                </Link>
              </td>
              <td className="py-3 pr-4 text-stone-500">
                {new Date(v.publishedAt).toLocaleDateString("ko-KR")}
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
                      title="처리 중..."
                    />
                  )}
                </div>
              </td>
              <td className="py-3 pr-4 text-right text-stone-500">{v.commentCount}</td>
              <td className="py-3 text-right">
                <button
                  onClick={() => deleteVideo(v.id, v.title)}
                  disabled={pending === v.id}
                  className="text-xs text-red-600 underline disabled:opacity-50"
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
