"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshVideosButton({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleRefresh() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/channels/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelInput: channelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error ?? "새로고침에 실패했습니다.", isError: true });
        return;
      }
      setMessage({
        text: data.newVideos > 0 ? `새 영상 ${data.newVideos}개 추가됨` : "새 영상 없음",
        isError: false,
      });
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
        onClick={handleRefresh}
        disabled={loading}
        className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
      >
        {loading ? "확인 중..." : "새로고침"}
      </button>
      {message && (
        <p className={`text-xs ${message.isError ? "text-red-600" : "text-stone-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
