import { NextResponse } from "next/server";
import { disconnectGoogle } from "@/lib/googleAuth";

export async function POST() {
  await disconnectGoogle();
  return NextResponse.json({ connected: false });
}
