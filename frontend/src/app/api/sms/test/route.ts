import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabaseServer";
import { sendSMS } from "@/lib/sms";
import { generatePrompt } from "@/lib/prompts";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("phone, timezone, google_connected, google_refresh_token")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profile not found. Save your phone number first." },
      { status: 400 }
    );
  }

  try {
    const prompt = await generatePrompt(admin, profile);
    await sendSMS(profile.phone, `[TEST] ${prompt}`);

    await admin
      .from("profiles")
      .update({ last_prompt_sent_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, prompt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
