"use client";

import { useEffect, useState } from "react";

export function GoogleConnectButton() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setConnected(data.connected))
      .catch(() => setConnected(false));
  }, []);

  async function handleDisconnect() {
    await fetch("/api/auth/google/disconnect", { method: "POST" });
    setConnected(false);
  }

  if (connected === null) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      {connected ? (
        <>
          <span className="text-green-700">구글 계정 연동됨</span>
          <button onClick={handleDisconnect} className="text-stone-500 underline">
            연동 해제
          </button>
        </>
      ) : (
        <a href="/api/auth/google" className="text-amber-800 underline">
          구글 계정 연동하기 (멤버십 댓글 조회용)
        </a>
      )}
    </div>
  );
}
