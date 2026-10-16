"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ExcludeKeywordButton({ channelId, word }: { channelId: string; word: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleExclude() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/keywords/exclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) throw new Error("제외 실패");
      // router.refresh()를 transition으로 묶어야 완료 시점까지 isPending이 유지되어
      // 목록이 다시 그려지는 동안 로딩 상태가 화면에 제대로 반영된다.
      startTransition(() => router.refresh());
    } catch {
      alert("키워드 제외에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const loading = submitting || isPending;

  return (
    <button
      onClick={handleExclude}
      disabled={loading}
      className="shrink-0 text-xs text-stone-400 underline hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "제외 중..." : "제외"}
    </button>
  );
}

export function RestoreKeywordButton({ channelId, word }: { channelId: string; word: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleRestore() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/channels/${channelId}/keywords/exclude`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) throw new Error("복원 실패");
      startTransition(() => router.refresh());
    } catch {
      alert("키워드 복원에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const loading = submitting || isPending;

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="shrink-0 text-xs text-stone-400 underline hover:text-stone-700 disabled:opacity-50"
    >
      {loading ? "복원 중..." : "복원"}
    </button>
  );
}
