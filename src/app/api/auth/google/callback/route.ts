import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/googleAuth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?googleAuth=error", request.nextUrl.origin));
  }

  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

  try {
    await exchangeCodeForTokens(code, redirectUri);
    return NextResponse.redirect(new URL("/?googleAuth=success", request.nextUrl.origin));
  } catch {
    return NextResponse.redirect(new URL("/?googleAuth=error", request.nextUrl.origin));
  }
}
