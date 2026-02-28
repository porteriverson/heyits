"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const HOURS = Array.from({ length: 24 }, (_, h) =>
  Array.from({ length: 4 }, (_, q) => {
    const hour = h.toString().padStart(2, "0");
    const minute = (q * 15).toString().padStart(2, "0");
    return `${hour}:${minute}`;
  })
).flat();

export default function ProfilePage() {
  const router = useRouter();
  // useMemo ensures the same client instance across re-renders (avoids Strict Mode lock contention)
  const supabase = useMemo(() => createClient(), []);

  // Timezones are environment-dependent (Node vs browser), so compute them
  // only on the client after hydration to avoid SSR/client mismatches.
  const [timezones, setTimezones] = useState<string[] | null>(null);
  const [phone, setPhone] = useState("");
  // "UTC" is a safe SSR default — updated to the real browser timezone in the load effect
  const [timezone, setTimezone] = useState("UTC");
  const [dailySendTime, setDailySendTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok?: boolean; prompt?: string; error?: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setHasProfile(true);
        setPhone(profile.phone);
        setTimezone(profile.timezone);
        setDailySendTime(profile.daily_send_time.slice(0, 5));
        setGoogleConnected(profile.google_connected ?? false);
      } else {
        // No saved profile — default to the browser's timezone (client-only, safe here)
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }

      // Populate timezone list on the client. This runs only after hydration,
      // so differences between server and browser Intl data won't cause
      // hydration mismatches.
      try {
        const supported = Intl.supportedValuesOf("timeZone");
        setTimezones([...supported].sort());
      } catch {
        // Fallback to a minimal, stable list if Intl.supportedValuesOf is unavailable.
        setTimezones(["UTC"]);
      }
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    const phoneE164 = phone.replace(/\D/g, "");
    if (phoneE164.length < 10) {
      setError("Enter a valid phone number (E.164 format, e.g. +15551234567).");
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      id: user.id,
      phone: phone.startsWith("+") ? phone : `+${phoneE164}`,
      timezone,
      daily_send_time: dailySendTime,
    };

    const { error: dbError } = hasProfile
      ? await supabase.from("profiles").update(payload).eq("id", user.id)
      : await supabase.from("profiles").insert(payload);

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess(true);
      setHasProfile(true);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <p className="text-muted mt-1">
            Set up your phone and journaling time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="+15551234567"
            />
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium mb-1"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              {timezones ? (
                timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))
              ) : (
                <option value={timezone}>Loading timezones...</option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="send-time"
              className="block text-sm font-medium mb-1"
            >
              Daily Prompt Time
            </label>
            <select
              id="send-time"
              value={dailySendTime}
              onChange={(e) => setDailySendTime(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-white"
            >
              {HOURS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Profile saved!
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <div className="border-t border-border pt-4 space-y-3">
          <h2 className="text-sm font-medium">Google Calendar</h2>
          {googleConnected ? (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Connected! Your prompts will reference today&apos;s events.
            </p>
          ) : (
            <a
              href="/api/auth/google"
              className="block text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent-light transition"
            >
              Connect Google Calendar
            </a>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <h2 className="text-sm font-medium">Test SMS</h2>
            <p className="text-xs text-muted mt-0.5">
              Send a prompt to your phone right now.
            </p>
          </div>
          <button
            type="button"
            disabled={testSending || !hasProfile}
            onClick={async () => {
              setTestSending(true);
              setTestResult(null);
              const res = await fetch("/api/sms/test", { method: "POST" });
              const json = await res.json();
              setTestResult(json);
              setTestSending(false);
            }}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent-light transition disabled:opacity-50"
          >
            {testSending ? "Sending..." : "Send Test Prompt"}
          </button>
          {testResult?.ok && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
              Sent! Prompt: &ldquo;{testResult.prompt}&rdquo;
            </p>
          )}
          {testResult?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {testResult.error}
            </p>
          )}
        </div>

        <div className="text-center">
          <a
            href="/dashboard"
            className="text-sm text-accent hover:underline"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
