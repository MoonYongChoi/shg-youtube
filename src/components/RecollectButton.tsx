"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RecollectButton({ videoId }: { videoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos/${videoId}/collect`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "수집에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded bg-stone-800 hover:bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "수집 중..." : "지금 다시 수집"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
