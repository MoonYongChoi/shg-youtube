export function ExportButton({ videoId, href }: { videoId?: string; href?: string }) {
  return (
    <a
      href={href ?? `/api/videos/${videoId}/export`}
      className="rounded border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
    >
      CSV 내보내기
    </a>
  );
}
