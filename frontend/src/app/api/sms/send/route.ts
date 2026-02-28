import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { sendSMS } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { to, body } = (await request.json()) as { to: string; body: string };

  if (!to || !body) {
    return NextResponse.json(
      { error: "Missing 'to' or 'body'" },
      { status: 400 }
    );
  }

  try {
    await sendSMS(to, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "SMS send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
