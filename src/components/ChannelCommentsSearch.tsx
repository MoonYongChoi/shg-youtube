"use client";

import { useState } from "react";
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

export function ChannelCommentsSearch({
  channelId,
  initialItems,
  initialHasMore,
  initialTotal,
}: {
  channelId: string;
  initialItems: CommentRow[];
  initialHasMore: boolean;
  initialTotal: number;
}) {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  async function fetchPage(nextPage: number, q: string, replace: boolean) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/channels/${channelId}/comments/feed?q=${encodeURIComponent(q)}&page=${nextPage}`,
      );
      const data = await res.json();
      setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuery(draft);
    fetchPage(0, draft, true);
  }

  function handleClear() {
    setDraft("");
    setQuery("");
    fetchPage(0, "", true);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="댓글 내용, 작성자로 검색 (Enter로 검색)"
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

      <p className="mt-2 text-xs text-stone-500">
        {query ? `${total}개 댓글 매치됨` : `전체 ${total}개 중 ${items.length}개 표시 중`}
      </p>

      {items.length > 0 ? (
        <div className="mt-6">
          <CommentTable comments={items} highlightQuery={query} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-stone-400">
          {query ? "일치하는 댓글이 없습니다." : "아직 수집된 댓글이 없습니다."}
        </p>
      )}

      {hasMore && (
        <button
          onClick={() => fetchPage(page + 1, query, false)}
          disabled={loading}
          className="mt-6 w-full rounded border border-stone-300 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
        >
          {loading ? "불러오는 중..." : "더 보기"}
        </button>
      )}
    </div>
  );
}
