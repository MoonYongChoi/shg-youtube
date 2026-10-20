"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  videoIds: string[];
}

/**
 * 서버에서 영상 전체를 한 번의 요청으로 순회하면(/api/channels/[id]/recollect) 영상이 많아질수록
 * maxDuration(5분)을 넘겨서 중간에 끊긴다. 그래서 브라우저가 영상 하나씩 기존 단일 수집 API를
 * 순서대로 호출하는 방식으로 바꿨다 — 호출 하나당 처리량이 작아 타임아웃 걱정이 없고, 진행률도 보여줄 수 있다.
 */
export function RecollectAllButton({ videoIds }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleClick() {
    if (videoIds.length === 0) {
      setMessage({ text: "모니터링 중인 영상이 없음", isError: false });
      return;
    }

    setLoading(true);
    setMessage(null);
    setProgress(0);

    let succeeded = 0;
    const errors: string[] = [];

    for (const videoId of videoIds) {
      try {
        const res = await fetch(`/api/videos/${videoId}/collect`, { method: "POST" });
        if (res.ok) {
          succeeded++;
        } else {
          errors.push(videoId);
        }
      } catch {
        errors.push(videoId);
      }
      setProgress((p) => p + 1);
    }

    setMessage({
      text: `${succeeded}/${videoIds.length}개 재수집 완료${errors.length > 0 ? ` (실패 ${errors.length}개)` : ""}`,
      isError: errors.length > 0,
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
      >
        {loading ? `수집 중... (${progress}/${videoIds.length})` : "댓글 재수집"}
      </button>
      {message && (
        <p className={`text-xs ${message.isError ? "text-red-600" : "text-stone-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
