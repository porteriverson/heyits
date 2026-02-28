import { NextRequest, NextResponse } from "next/server";
import { runScheduler } from "@/lib/scheduler";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScheduler();
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Scheduler failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
