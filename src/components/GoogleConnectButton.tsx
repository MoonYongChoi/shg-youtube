"use client";

import { useEffect, useState } from "react";

type Status = "connected" | "expired" | "disconnected" | null;

export function GoogleConnectButton() {
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("disconnected"));
  }, []);

  async function handleDisconnect() {
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    setStatus("disconnected");
  }

  if (status === null) return null;

  if (status === "connected") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-green-700">구글 계정 연동됨</span>
        <button onClick={handleDisconnect} className="text-stone-500 underline">
          연동 해제
        </button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-red-600">
          구글 연동이 끊어졌습니다 (토큰 만료) — 재연결이 필요합니다
        </span>
        <a href="/api/auth/google" className="text-amber-800 underline">
          다시 연결하기
        </a>
      </div>
    );
  }

  return (
    <a href="/api/auth/google" className="text-sm text-amber-800 underline">
      구글 계정 연동하기 (멤버십 댓글 조회용)
    </a>
  );
}
