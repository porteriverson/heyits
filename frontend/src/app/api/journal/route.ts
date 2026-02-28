import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("id, content, event_summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: photos } = await supabase
    .from("journal_photos")
    .select("id, entry_id, storage_path")
    .eq("user_id", user.id);

  const entriesWithPhotos = (entries ?? []).map((entry) => ({
    ...entry,
    photos: (photos ?? []).filter((p) => p.entry_id === entry.id),
  }));

  return NextResponse.json(entriesWithPhotos);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const content = (body.content ?? "").trim();

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ content, user_id: user.id, source: "web" })
    .select("id, content, event_summary, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, photos: [] }, { status: 201 });
}
