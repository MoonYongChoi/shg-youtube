import Papa from "papaparse";

export interface CommentForCsv {
  id: string;
  parentId: string | null;
  authorName: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  history: { textOriginal: string; likeCount: number; capturedAt: Date }[];
}

function formatHistory(history: CommentForCsv["history"]): string {
  return history.map((h) => `[${h.capturedAt.toISOString()}] ${h.textOriginal}`).join(" | ");
}

function threadRow(parent: CommentForCsv, reply: CommentForCsv | null) {
  return {
    parent_comment_id: parent.id,
    parent_author: parent.authorName,
    parent_text: parent.textOriginal,
    parent_like_count: parent.likeCount,
    parent_published_at: parent.publishedAt.toISOString(),
    parent_updated_at: parent.updatedAt.toISOString(),
    parent_is_deleted: parent.isDeleted,
    parent_edit_history: formatHistory(parent.history),
    reply_comment_id: reply?.id ?? "",
    reply_author: reply?.authorName ?? "",
    reply_text: reply?.textOriginal ?? "",
    reply_like_count: reply?.likeCount ?? "",
    reply_published_at: reply?.publishedAt.toISOString() ?? "",
    reply_updated_at: reply?.updatedAt.toISOString() ?? "",
    reply_is_deleted: reply?.isDeleted ?? "",
    reply_edit_history: reply ? formatHistory(reply.history) : "",
  };
}

/**
 * parentId가 없는 본댓글마다 그 스레드의 운영자 대댓글(있으면)을 찾아 짝지어준다.
 * 대댓글이 교체된 적이 있으면(과거 오수집 교정 등) 삭제되지 않은 쪽을 우선한다.
 */
function groupThreads(
  comments: CommentForCsv[],
): { parent: CommentForCsv; reply: CommentForCsv | null }[] {
  const repliesByParent = new Map<string, CommentForCsv[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const list = repliesByParent.get(c.parentId) ?? [];
    list.push(c);
    repliesByParent.set(c.parentId, list);
  }

  return comments
    .filter((c) => !c.parentId)
    .map((parent) => {
      const replies = repliesByParent.get(parent.id) ?? [];
      const reply = replies.find((r) => !r.isDeleted) ?? replies[0] ?? null;
      return { parent, reply };
    });
}

export function videoThreadsToCsv(comments: CommentForCsv[]): string {
  const rows = groupThreads(comments).map(({ parent, reply }) => threadRow(parent, reply));
  // UTF-8 BOM을 붙여 엑셀에서 한글이 깨지지 않도록 함
  return "﻿" + Papa.unparse(rows);
}

export function channelThreadsToCsv(
  videos: { id: string; title: string; comments: CommentForCsv[] }[],
): string {
  const rows = videos.flatMap((video) =>
    groupThreads(video.comments).map(({ parent, reply }) => ({
      video_id: video.id,
      video_title: video.title,
      ...threadRow(parent, reply),
    })),
  );
  return "﻿" + Papa.unparse(rows);
}
