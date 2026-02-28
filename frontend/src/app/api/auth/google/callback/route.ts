import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";
import { exchangeCodeForTokens } from "@/lib/google";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // user id

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_params", request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const supabase = createAdminClient();

    await supabase
      .from("profiles")
      .update({
        google_connected: true,
        google_refresh_token: tokens.refresh_token ?? null,
      })
      .eq("id", state);

    return NextResponse.redirect(
      new URL("/dashboard?google=connected", request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard?error=google_failed", request.url),
    );
  }
}
