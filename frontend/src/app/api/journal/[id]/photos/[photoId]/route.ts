import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const supabase = await createClient();
  const { id: entryId, photoId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: photo } = await supabase
    .from("journal_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("entry_id", entryId)
    .eq("user_id", user.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await supabase.storage.from("journal-photos").remove([photo.storage_path]);

  const { error } = await supabase
    .from("journal_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
