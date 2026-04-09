import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRealtimeInsights } from "@/server/dashboard";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const insights = await getRealtimeInsights(user.id);
  return NextResponse.json(insights);
}
