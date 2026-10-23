import { NextResponse } from "next/server";
import { getGoogleConnectionStatus } from "@/lib/googleAuth";

export async function GET() {
  return NextResponse.json({ status: await getGoogleConnectionStatus() });
}
