export function ExportButton({ videoId }: { videoId: string }) {
  return (
    <a
      href={`/api/videos/${videoId}/export`}
      className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
    >
      CSV 내보내기
    </a>
  );
}
