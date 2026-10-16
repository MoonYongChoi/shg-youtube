"use client";

import Link from "next/link";
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
}

interface VideoWithComments {
  id: string;
  title: string;
  comments: CommentRow[];
}

function filterComments(comments: CommentRow[], query: string): CommentRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return comments;

  const matches = (c: CommentRow) =>
    c.textOriginal.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q);

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

export function ChannelCommentsSearch({ videos }: { videos: VideoWithComments[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return videos
      .map((v) => ({ ...v, comments: filterComments(v.comments, query) }))
      .filter((v) => v.comments.length > 0);
  }, [videos, query]);

  const totalMatches = filtered.reduce((sum, v) => sum + v.comments.length, 0);

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="댓글 내용이나 작성자로 검색"
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
          >
            지우기
          </button>
        )}
      </div>
      {query && (
        <p className="mt-2 text-xs text-stone-500">
          {totalMatches > 0 ? `${totalMatches}개 댓글 매치됨` : "일치하는 댓글이 없습니다"}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-stone-400">
          {query ? "검색 결과가 없습니다." : "아직 수집된 댓글이 없습니다."}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {filtered.map((video) => (
            <div key={video.id}>
              <Link
                href={`/videos/${video.id}`}
                className="text-sm font-medium text-stone-600 hover:underline"
              >
                {video.title}
              </Link>
              <p className="mt-0.5 mb-3 text-xs text-stone-400">댓글 {video.comments.length}개</p>
              <CommentTable comments={video.comments} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
