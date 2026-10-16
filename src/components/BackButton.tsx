"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <div className="mb-2 flex items-center gap-3 text-sm text-stone-500">
      <button onClick={() => router.back()} className="hover:text-stone-800">
        ← 뒤로
      </button>
      <Link href="/" className="hover:text-stone-800">
        홈
      </Link>
    </div>
  );
}
