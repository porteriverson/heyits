"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

interface Props {
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialTimezone: string;
  initialSendTime: string;
  initialSendTimeType: string;
  googleConnected: boolean;
}

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-base">{title}</h2>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium">{label}</label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow placeholder:text-muted";

export default function SettingsForm({
  initialName,
  initialEmail,
  initialPhone,
  initialTimezone,
  initialSendTime,
  initialSendTimeType,
  googleConnected,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [timezones, setTimezones] = useState<string[] | null>(null);

  // Profile fields
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [sendTime, setSendTime] = useState(initialSendTime);
  const [sendTimeType, setSendTimeType] = useState(initialSendTimeType);

  // Email change
  const [newEmail, setNewEmail] = useState(initialEmail);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile save
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Test SMS
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok?: boolean; prompt?: string; error?: string } | null>(null);

  useEffect(() => {
    try {
      const supported = Intl.supportedValuesOf("timeZone");
      setTimezones([...supported].sort());
    } catch {
      setTimezones(["UTC"]);
    }
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setSaveMsg({ type: "error", text: "Enter a valid phone number." });
      setSaving(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        phone: phone.startsWith("+") ? phone : `+${digits}`,
        timezone,
        daily_send_time: sendTime,
        send_time_type: sendTimeType,
      })
      .eq("id", user.id);

    if (error) {
      setSaveMsg({ type: "error", text: error.message });
    } else {
      setSaveMsg({ type: "success", text: "Settings saved!" });
      router.refresh();
    }
    setSaving(false);
  }

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (newEmail === initialEmail) return;
    setEmailSaving(true);
    setEmailMsg(null);

    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setEmailMsg({ type: "error", text: error.message });
    } else {
      setEmailMsg({
        type: "success",
        text: "Confirmation sent to your new email. Click the link to complete the change.",
      });
    }
    setEmailSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Profile section */}
      <Section title="Profile" description="Your display name and contact info.">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Field label="Name" hint="Shown in the navigation">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Your name"
            />
          </Field>

          <Field label="Phone Number" hint="E.164 format">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+15551234567"
            />
          </Field>

          {saveMsg && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                saveMsg.type === "success"
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {saveMsg.text}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </Section>

      {/* Email section */}
      <Section title="Email Address" description="Update the email you use to log in.">
        <form onSubmit={handleUpdateEmail} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </Field>

          {emailMsg && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                emailMsg.type === "success"
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {emailMsg.text}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={emailSaving || newEmail === initialEmail}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {emailSaving && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {emailSaving ? "Sending…" : "Update email"}
            </button>
          </div>
        </form>
      </Section>

      {/* Journaling preferences */}
      <Section title="Journaling Schedule" description="When you receive your daily prompt.">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Field label="Daily Prompt Time">
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Delivery Style">
            <div className="flex gap-3">
              {(["on", "around"] as const).map((val) => (
                <label
                  key={val}
                  className={`flex-1 flex items-center gap-2.5 rounded-lg border px-4 py-3 cursor-pointer transition-colors text-sm ${
                    sendTimeType === val
                      ? "border-accent bg-accent-light text-accent font-medium"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="sendTimeType"
                    value={val}
                    checked={sendTimeType === val}
                    onChange={() => setSendTimeType(val)}
                    className="sr-only"
                  />
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${sendTimeType === val ? "border-accent" : "border-muted"}`}>
                    {sendTimeType === val && <span className="w-1.5 h-1.5 rounded-full bg-accent block" />}
                  </span>
                  <div>
                    <div className="font-medium capitalize">{val} time</div>
                    <div className="text-xs text-muted mt-0.5">
                      {val === "on" ? "Exactly at the time you set" : "Within ~20 min of the time"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Timezone">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass + " bg-white"}
            >
              {timezones ? (
                timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))
              ) : (
                <option value={timezone}>Loading timezones…</option>
              )}
            </select>
          </Field>

          {saveMsg && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                saveMsg.type === "success"
                  ? "text-green-700 bg-green-50"
                  : "text-red-600 bg-red-50"
              }`}
            >
              {saveMsg.text}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {saving ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </form>
      </Section>

      {/* Integrations */}
      <Section title="Integrations" description="Connect apps to personalize your prompts.">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center bg-white shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Google Calendar</p>
              <p className="text-xs text-muted">
                {googleConnected
                  ? "Connected — prompts reference today's events"
                  : "Personalizes prompts with your day's events"}
              </p>
            </div>
          </div>
          {googleConnected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Connected
            </span>
          ) : (
            <a
              href="/api/auth/google"
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent-light hover:border-accent/40 transition shrink-0"
            >
              Connect
            </a>
          )}
        </div>
      </Section>

      {/* Test SMS */}
      <Section title="Test Prompt" description="Send a prompt to your phone right now to check everything's working.">
        <button
          type="button"
          disabled={testSending}
          onClick={async () => {
            setTestSending(true);
            setTestResult(null);
            const res = await fetch("/api/sms/test", { method: "POST" });
            const json = await res.json();
            setTestResult(json);
            setTestSending(false);
          }}
          className="px-5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent-light hover:border-accent/40 transition disabled:opacity-50 flex items-center gap-2"
        >
          {testSending && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
          {testSending ? "Sending…" : "Send test prompt"}
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
      </Section>
    </div>
  );
}
