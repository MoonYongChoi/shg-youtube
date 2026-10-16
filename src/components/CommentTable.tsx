"use client";

import Link from "next/link";
import { useState } from "react";

interface HistoryEntry {
  textOriginal: string;
  likeCount: number;
  capturedAt: string;
}

interface CommentRow {
  id: string;
  parentId: string | null;
  authorName: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: string;
  isDeleted: boolean;
  history: HistoryEntry[];
  videoId?: string;
  videoTitle?: string;
}

export function CommentTable({ comments }: { comments: CommentRow[] }) {
  const topLevel = comments.filter((c) => !c.parentId);
  const repliesByParent = new Map<string, CommentRow[]>();
  for (const c of comments) {
    if (c.parentId) {
      repliesByParent.set(c.parentId, [...(repliesByParent.get(c.parentId) ?? []), c]);
    }
  }

  if (topLevel.length === 0) {
    return <p className="text-sm text-stone-400">아직 수집된 댓글이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {topLevel.map((comment) => (
        <li key={comment.id} className="rounded-xl border border-stone-200 p-4">
          <CommentItem comment={comment} />
          {(repliesByParent.get(comment.id) ?? []).map((reply) => (
            <div key={reply.id} className="mt-3 ml-4 border-l border-stone-200 pl-3 sm:ml-8 sm:pl-4">
              <CommentItem comment={reply} showVideoTag={false} />
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}

function CommentItem({
  comment,
  showVideoTag = true,
}: {
  comment: CommentRow;
  showVideoTag?: boolean;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div>
      {showVideoTag && comment.videoTitle && comment.videoId && (
        <Link
          href={`/videos/${comment.videoId}`}
          className="mb-1 block truncate text-xs text-stone-400 hover:underline"
        >
          {comment.videoTitle}
        </Link>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-sm font-medium">{comment.authorName}</span>
        <span className="text-xs text-stone-400">
          {new Date(comment.publishedAt).toLocaleString("ko-KR")}
        </span>
      </div>
      <p className="mt-1 text-sm whitespace-pre-wrap">
        {comment.isDeleted ? <span className="text-stone-400 italic">(삭제됨)</span> : comment.textOriginal}
      </p>
      <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
        <span>좋아요 {comment.likeCount}</span>
        {comment.history.length > 0 && (
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="underline hover:text-stone-700"
          >
            수정 히스토리 {comment.history.length}건 {showHistory ? "숨기기" : "보기"}
          </button>
        )}
      </div>
      {showHistory && (
        <ul className="mt-2 space-y-2 rounded bg-stone-50 p-3 text-xs">
          {comment.history.map((h, idx) => (
            <li key={idx}>
              <span className="text-stone-400">
                {new Date(h.capturedAt).toLocaleString("ko-KR")} 이전 버전:
              </span>{" "}
              <span className="whitespace-pre-wrap">{h.textOriginal}</span>{" "}
              <span className="text-stone-400">(좋아요 {h.likeCount})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
