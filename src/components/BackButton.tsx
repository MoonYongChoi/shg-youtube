"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="mb-2 text-sm text-stone-500 hover:text-stone-800"
    >
      ← 뒤로
    </button>
  );
}
