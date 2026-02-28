import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-poller-secret");
  if (process.env.POLLER_SECRET && secret !== process.env.POLLER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { from, body } = (await request.json()) as {
    from: string;
    body: string;
  };

  if (!from || !body?.trim()) {
    return NextResponse.json(
      { error: "Missing from or body" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();
  const normalizedPhone = from.startsWith("+") ? from : `+${from}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, phone_verified, last_prompt_sent_at, last_prompt_text, last_prompt_title",
    )
    .eq("phone", normalizedPhone)
    .single();

  if (!profile) {
    return NextResponse.json({ saved: false, reason: "unknown_number" });
  }

  const upper = body.trim().toUpperCase();

  if (upper === "STOP") {
    await supabase
      .from("profiles")
      .update({ phone_verified: false })
      .eq("id", profile.id);
    return NextResponse.json({ saved: false, reason: "stopped" });
  }

  if (upper === "START") {
    await supabase
      .from("profiles")
      .update({ phone_verified: true })
      .eq("id", profile.id);
    return NextResponse.json({ saved: false, reason: "started" });
  }

  // Only save if there's a pending prompt within the last 12 hours
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const lastSent = profile.last_prompt_sent_at
    ? new Date(profile.last_prompt_sent_at)
    : null;

  if (!lastSent || lastSent < cutoff) {
    return NextResponse.json({ saved: false, reason: "no_pending_prompt" });
  }

  await supabase.from("journal_entries").insert({
    user_id: profile.id,
    content: body.trim(),
    source: "sms",
    prompt_text: profile.last_prompt_text ?? null,
    prompt_title: profile.last_prompt_title ?? null,
  });

  // Clear the pending flag so only the first reply is saved
  await supabase
    .from("profiles")
    .update({ last_prompt_sent_at: null })
    .eq("id", profile.id);

  return NextResponse.json({ saved: true });
}
