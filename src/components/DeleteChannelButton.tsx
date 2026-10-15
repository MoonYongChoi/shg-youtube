"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteChannelButton({
  channelId,
  channelTitle,
  redirectTo,
}: {
  channelId: string;
  channelTitle: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${channelTitle}" 채널과 수집된 모든 영상/댓글을 삭제할까요?`)) return;

    setLoading(true);
    try {
      await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 underline disabled:opacity-50"
    >
      {loading ? "삭제 중..." : "삭제"}
    </button>
  );
}
