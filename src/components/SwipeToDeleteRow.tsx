"use client";

import { useRef, useState } from "react";

const REVEAL_WIDTH = 72;

export function SwipeToDeleteRow({
  onDelete,
  disabled,
  children,
}: {
  onDelete: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startTranslate = useRef(0);

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startTranslate.current = translateX;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-REVEAL_WIDTH, startTranslate.current + delta));
    setTranslateX(next);
  }

  function handleTouchEnd() {
    setDragging(false);
    setTranslateX((prev) => (prev < -REVEAL_WIDTH / 2 ? -REVEAL_WIDTH : 0));
  }

  return (
    <li className="relative overflow-hidden rounded-xl border border-stone-200">
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        <button
          onClick={() => {
            onDelete();
            setTranslateX(0);
          }}
          disabled={disabled}
          style={{ width: REVEAL_WIDTH }}
          className="flex items-center justify-center bg-red-600 text-xs font-medium text-white disabled:opacity-50"
        >
          삭제
        </button>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 150ms ease-out",
        }}
        className="relative bg-[var(--background)] p-3"
      >
        {children}
      </div>
    </li>
  );
}
