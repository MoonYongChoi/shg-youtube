import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";
import { logAccess } from "@/lib/logging";

const COOKIE_NAME = "app_auth";

export async function middleware(request: NextRequest) {
  const expected = createHash("sha256").update(process.env.APP_PASSWORD ?? "").digest("hex");
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const authorized = cookie === expected;

  await logAccess(
    request.method,
    request.nextUrl.pathname,
    authorized,
    request.headers,
  );

  if (!authorized) {
    return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!login|api/auth/login|api/cron|_next/static|_next/image|favicon.ico|opengraph-image).*)",
  ],
};
