"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddVideoForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/videos/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoInput: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "영상을 추가하지 못했습니다.");
        return;
      }
      setValue("");
      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="멤버십 영상 URL (채널 목록에 안 뜨는 영상 직접 추가)"
          className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "추가 중..." : "추가"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
