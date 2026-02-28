import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import JournalManager, { type Entry } from "./journal-manager";
import Nav from "@/components/nav";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, timezone, daily_send_time, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_completed) redirect("/onboarding");

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, content, event_summary, prompt_text, prompt_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: photos } = await supabase
    .from("journal_photos")
    .select("id, entry_id, storage_path")
    .eq("user_id", user.id);

  const entriesWithPhotos: Entry[] = (entries ?? []).map((entry) => ({
    ...entry,
    photos: (photos ?? [])
      .filter((p) => p.entry_id === entry.id)
      .map((p) => ({ id: p.id, storage_path: p.storage_path })),
  }));

  return (
    <div className="min-h-screen">
      <Nav name={profile.name ?? ""} email={user.email ?? ""} />
      <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Your Journal</h1>
          <p className="text-muted text-sm mt-0.5">
            Prompts sent daily at {profile.daily_send_time.slice(0, 5)} ({profile.timezone})
          </p>
        </div>

        <JournalManager
          initialEntries={entriesWithPhotos}
          journalName={profile.name ? `${profile.name}'s Journal` : "Your Journal"}
        />
      </main>
    </div>
  );
}
