"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "로그인에 실패했습니다.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center px-6 py-32">
      <h1 className="text-xl font-semibold">비밀번호 입력</h1>
      <form onSubmit={handleSubmit} className="mt-6">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          autoFocus
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "확인 중..." : "입장"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
