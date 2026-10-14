import { NextResponse } from "next/server";
import { isGoogleConnected } from "@/lib/googleAuth";

export async function GET() {
  return NextResponse.json({ connected: await isGoogleConnected() });
}
