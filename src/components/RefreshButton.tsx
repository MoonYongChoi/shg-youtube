"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton({ label = "새로고침" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
    >
      {isPending ? "새로고침 중..." : label}
    </button>
  );
}
