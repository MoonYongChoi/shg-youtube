"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecollectAllButton({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/channels/${channelId}/recollect`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error ?? "재수집에 실패했습니다.", isError: true });
        return;
      }
      const text =
        data.total === 0
          ? "모니터링 중인 영상이 없음"
          : `${data.succeeded}/${data.total}개 재수집 완료${data.errors.length > 0 ? ` (실패 ${data.errors.length}개)` : ""}`;
      setMessage({ text, isError: data.errors.length > 0 });
      router.refresh();
    } catch {
      setMessage({ text: "요청 중 오류가 발생했습니다.", isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
      >
        {loading ? "수집 중..." : "댓글 재수집"}
      </button>
      {message && (
        <p className={`text-xs ${message.isError ? "text-red-600" : "text-stone-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
