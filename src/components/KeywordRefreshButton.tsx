"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function KeywordRefreshButton({ channelId }: { channelId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    setSubmitting(true);
    try {
      await fetch(`/api/channels/${channelId}/keywords/refresh`, { method: "POST" });
      startTransition(() => router.refresh());
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || isPending;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
    >
      {busy ? "분석 중..." : "새로고침"}
    </button>
  );
}
