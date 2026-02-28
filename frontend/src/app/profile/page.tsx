import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import Nav from "@/components/nav";
import SettingsForm from "./settings-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "name, phone, timezone, daily_send_time, send_time_type, google_connected, onboarding_completed",
    )
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarding_completed) redirect("/onboarding");

  return (
    <div className="min-h-screen">
      <Nav name={profile.name ?? ""} email={user.email ?? ""} />
      <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted text-sm mt-0.5">
            Manage your account and journaling preferences.
          </p>
        </div>
        <SettingsForm
          initialName={profile.name ?? ""}
          initialEmail={user.email ?? ""}
          initialPhone={profile.phone}
          initialTimezone={profile.timezone}
          initialSendTime={profile.daily_send_time.slice(0, 5)}
          initialSendTimeType={profile.send_time_type}
          googleConnected={profile.google_connected ?? false}
        />
      </main>
    </div>
  );
}
