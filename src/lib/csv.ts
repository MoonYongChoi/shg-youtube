import Papa from "papaparse";

export interface CommentCsvRow {
  commentId: string;
  parentId: string | null;
  authorName: string;
  textOriginal: string;
  likeCount: number;
  publishedAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  historyIndex: number | null;
  historyCapturedAt: Date | null;
}

export function commentsToCsv(rows: CommentCsvRow[]): string {
  const data = rows.map((row) => ({
    comment_id: row.commentId,
    parent_id: row.parentId ?? "",
    type: row.historyIndex !== null ? "history" : "current",
    history_index: row.historyIndex ?? "",
    author_name: row.authorName,
    text: row.textOriginal,
    like_count: row.likeCount,
    published_at: row.publishedAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    captured_at: row.historyCapturedAt?.toISOString() ?? "",
    is_deleted: row.isDeleted,
  }));

  const csv = Papa.unparse(data);
  // UTF-8 BOM을 붙여 엑셀에서 한글이 깨지지 않도록 함
  return "﻿" + csv;
}
