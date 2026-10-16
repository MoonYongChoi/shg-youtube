"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ExcludeKeywordButton({ channelId, word }: { channelId: string; word: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleExclude() {
    setLoading(true);
    try {
      await fetch(`/api/channels/${channelId}/keywords/exclude`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExclude}
      disabled={loading}
      className="shrink-0 text-xs text-stone-400 underline hover:text-red-600 disabled:opacity-50"
    >
      제외
    </button>
  );
}

export function RestoreKeywordButton({ channelId, word }: { channelId: string; word: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRestore() {
    setLoading(true);
    try {
      await fetch(`/api/channels/${channelId}/keywords/exclude`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="shrink-0 text-xs text-stone-400 underline hover:text-stone-700 disabled:opacity-50"
    >
      복원
    </button>
  );
}
