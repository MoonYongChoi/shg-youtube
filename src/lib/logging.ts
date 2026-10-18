import { prisma } from "@/lib/prisma";

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}

/** 비밀번호 값 자체는 절대 기록하지 않고 성공/실패와 접속 정보만 남긴다 */
export async function logLoginAttempt(success: boolean, headers: Headers): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        success,
        ip: getClientIp(headers),
        userAgent: headers.get("user-agent"),
      },
    });
  } catch {
    // 로깅 실패가 로그인 자체를 막으면 안 됨
  }
}

export async function logAccess(
  method: string,
  path: string,
  authorized: boolean,
  headers: Headers,
): Promise<void> {
  try {
    await prisma.accessLog.create({
      data: {
        method,
        path,
        authorized,
        ip: getClientIp(headers),
        userAgent: headers.get("user-agent"),
      },
    });
  } catch {
    // 로깅 실패가 요청 처리 자체를 막으면 안 됨
  }
}
