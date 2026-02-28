import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import JournalList from "./journal-list";
import Nav from "@/components/nav";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, timezone, daily_send_time, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_completed) redirect("/onboarding");

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, content, event_summary, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen">
      <Nav email={user.email ?? ""} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Journal</h1>
            <p className="text-muted text-sm mt-0.5">
              Prompts sent daily at {profile.daily_send_time.slice(0, 5)} ({profile.timezone})
            </p>
          </div>
          <a
            href="/profile"
            className="text-sm text-accent hover:underline"
          >
            Settings
          </a>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted">
              No entries yet. Reply to your next SMS prompt to get started!
            </p>
          </div>
        ) : (
          <JournalList entries={entries} />
        )}
      </main>
    </div>
  );
}
