import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

const COOKIE_NAME = "app_auth";

export function middleware(request: NextRequest) {
  const expected = createHash("sha256").update(process.env.APP_PASSWORD ?? "").digest("hex");
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (cookie !== expected) {
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
