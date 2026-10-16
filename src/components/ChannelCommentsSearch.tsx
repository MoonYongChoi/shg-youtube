"use client";

import { useMemo, useState } from "react";
import { CommentTable } from "@/components/CommentTable";

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
  videoId: string;
  videoTitle: string;
}

function filterComments(comments: CommentRow[], query: string): CommentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return comments;

  const matches = (c: CommentRow) =>
    c.textOriginal.toLowerCase().includes(q) ||
    c.authorName.toLowerCase().includes(q) ||
    c.videoTitle.toLowerCase().includes(q);

  const keepIds = new Set<string>();
  for (const c of comments) {
    if (matches(c)) {
      keepIds.add(c.id);
      if (c.parentId) keepIds.add(c.parentId); // 대댓글이 매치되면 본댓글도 같이 보여줌
    }
  }
  for (const c of comments) {
    if (c.parentId && keepIds.has(c.parentId)) keepIds.add(c.id); // 본댓글이 매치되면 대댓글도 같이 보여줌
  }

  return comments.filter((c) => keepIds.has(c.id));
}

/** comments는 이미 최신순(스레드 단위)으로 정렬되어 들어온다고 가정 */
export function ChannelCommentsSearch({ comments }: { comments: CommentRow[] }) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterComments(comments, query), [comments, query]);
  const matchedThreads = filtered.filter((c) => !c.parentId).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuery(draft);
  }

  function handleClear() {
    setDraft("");
    setQuery("");
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="댓글 내용, 작성자, 영상 제목으로 검색 (Enter로 검색)"
          className="w-full rounded border border-stone-300 px-3 py-2 pr-16 text-sm"
        />
        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
          {draft && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              지우기
            </button>
          )}
          <button
            type="submit"
            className="rounded bg-stone-800 px-2 py-1 text-xs font-medium text-white hover:bg-stone-900"
          >
            검색
          </button>
        </div>
      </form>
      {query && (
        <p className="mt-2 text-xs text-stone-500">
          {matchedThreads > 0 ? `${matchedThreads}개 댓글 매치됨` : "일치하는 댓글이 없습니다"}
        </p>
      )}

      {filtered.length > 0 ? (
        <div className="mt-6">
          <CommentTable comments={filtered} highlightQuery={query} />
        </div>
      ) : (
        !query && <p className="mt-8 text-sm text-stone-400">아직 수집된 댓글이 없습니다.</p>
      )}
    </div>
  );
}
