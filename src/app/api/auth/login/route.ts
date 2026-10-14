import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "app_auth";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, hashPassword(password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
