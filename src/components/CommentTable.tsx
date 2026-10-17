"use client";

import Link from "next/link";
import { useState } from "react";
import { formatKST } from "@/lib/date";

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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="rounded bg-amber-200 px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function CommentTable({
  comments,
  highlightQuery,
}: {
  comments: CommentRow[];
  highlightQuery?: string;
}) {
  const ids = new Set(comments.map((c) => c.id));
  // parentId가 있어도 그 본댓글이 이번 목록(페이지)에 없으면 독립된 항목으로 취급
  // (페이지네이션/검색 결과에서 본댓글과 대댓글이 서로 다른 페이지에 걸쳐 나뉠 수 있어서)
  const topLevel = comments.filter((c) => !c.parentId || !ids.has(c.parentId));
  const repliesByParent = new Map<string, CommentRow[]>();
  for (const c of comments) {
    if (c.parentId && ids.has(c.parentId)) {
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
          <CommentItem comment={comment} highlightQuery={highlightQuery} />
          {(repliesByParent.get(comment.id) ?? []).map((reply) => (
            <div key={reply.id} className="mt-3 ml-4 border-l border-stone-200 pl-3 sm:ml-8 sm:pl-4">
              <CommentItem comment={reply} showVideoTag={false} highlightQuery={highlightQuery} />
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
  highlightQuery,
}: {
  comment: CommentRow;
  showVideoTag?: boolean;
  highlightQuery?: string;
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div>
      {showVideoTag && comment.videoTitle && comment.videoId && (
        <Link
          href={`/videos/${comment.videoId}`}
          className="mb-1 block truncate text-xs text-stone-400 hover:underline"
        >
          <Highlight text={comment.videoTitle} query={highlightQuery} />
        </Link>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="text-sm font-medium">
          <Highlight text={comment.authorName} query={highlightQuery} />
        </span>
        <span className="text-xs text-stone-400">
          {formatKST(comment.publishedAt)}
        </span>
      </div>
      <p className="mt-1 text-sm whitespace-pre-wrap">
        {comment.isDeleted ? (
          <span className="text-stone-400 italic">(삭제됨)</span>
        ) : (
          <Highlight text={comment.textOriginal} query={highlightQuery} />
        )}
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
                {formatKST(h.capturedAt)} 이전 버전:
              </span>{" "}
              <span className="whitespace-pre-wrap">
                <Highlight text={h.textOriginal} query={highlightQuery} />
              </span>{" "}
              <span className="text-stone-400">(좋아요 {h.likeCount})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
