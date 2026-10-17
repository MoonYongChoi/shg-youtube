export function formatKST(date: Date | string): string {
  return new Date(date).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function formatKSTDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}
