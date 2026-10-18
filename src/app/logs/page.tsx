import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKST } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const [recentLogins, loginStats, recentAccess] = await Promise.all([
    prisma.loginAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.loginAttempt.groupBy({ by: ["success"], _count: { _all: true } }),
    prisma.accessLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const successCount = loginStats.find((s) => s.success)?._count._all ?? 0;
  const failCount = loginStats.find((s) => !s.success)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-16">
      <Link href="/" className="text-sm text-stone-500 underline">
        ← 홈으로
      </Link>
      <h1 className="mt-2 text-xl font-semibold sm:text-2xl">접속 로그</h1>
      <p className="mt-2 text-sm text-stone-500">
        비밀번호 시도 총 {successCount + failCount}건 (성공 {successCount} · 실패 {failCount})
      </p>

      <h2 className="mt-8 text-sm font-medium text-stone-500">
        최근 로그인 시도 (최신 {recentLogins.length}건)
      </h2>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {recentLogins.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center gap-2 rounded border border-stone-100 px-2 py-1"
          >
            <span
              className={
                l.success ? "font-medium text-green-700" : "font-medium text-red-600"
              }
            >
              {l.success ? "성공" : "실패"}
            </span>
            <span className="text-stone-400">{formatKST(l.createdAt)}</span>
            <span className="text-stone-400">{l.ip ?? "IP 없음"}</span>
            <span className="min-w-0 truncate text-stone-400">{l.userAgent ?? ""}</span>
          </li>
        ))}
        {recentLogins.length === 0 && <li className="text-stone-400">기록이 없습니다.</li>}
      </ul>

      <h2 className="mt-8 text-sm font-medium text-stone-500">
        최근 접속 로그 (최신 {recentAccess.length}건)
      </h2>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {recentAccess.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-2 rounded border border-stone-100 px-2 py-1"
          >
            <span
              className={a.authorized ? "text-stone-500" : "font-medium text-red-600"}
            >
              {a.authorized ? "허용" : "미인증"}
            </span>
            <span className="text-stone-400">{formatKST(a.createdAt)}</span>
            <span className="font-mono text-stone-600">
              {a.method} {a.path}
            </span>
            <span className="text-stone-400">{a.ip ?? "IP 없음"}</span>
          </li>
        ))}
        {recentAccess.length === 0 && <li className="text-stone-400">기록이 없습니다.</li>}
      </ul>
    </div>
  );
}
