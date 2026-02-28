"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

// ─── Types & constants ────────────────────────────────────────────────────────

type BotName = "Cooper" | "Claire";
type SendTimeType = "on" | "around";

const GOALS = [
  "Improve mental health",
  "Posterity — pass it on",
  "Offload mental clutter",
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function to24Hour(hour: string, minute: string, period: string): string {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${h.toString().padStart(2, "0")}:${minute}`;
}

// ─── AnimatedText ─────────────────────────────────────────────────────────────

function AnimatedText({
  text,
  className,
  wordDelay = 65,
  onDone,
}: {
  text: string;
  className?: string;
  wordDelay?: number;
  onDone?: () => void;
}) {
  const words = text.split(" ");

  useEffect(() => {
    const totalMs = (words.length - 1) * wordDelay + 300;
    const t = setTimeout(() => onDone?.(), totalMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline",
            animation: "wordFadeIn 0.25s ease both",
            animationDelay: `${i * wordDelay}ms`,
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}

// ─── FadeIn wrapper ───────────────────────────────────────────────────────────

function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: "fadeSlideUp 0.4s ease both" }}>
      {children}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex gap-2 justify-center mb-10">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-500"
          style={{
            width: i < step ? "24px" : "6px",
            backgroundColor: i < step ? "var(--accent)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

// ─── StepShell ────────────────────────────────────────────────────────────────

function StepShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div
        key={step}
        className="w-full max-w-xs"
        style={{ animation: "stepFadeIn 0.4s ease both" }}
      >
        <ProgressDots step={step} />
        {children}
      </div>
    </div>
  );
}

// ─── BotAvatar ────────────────────────────────────────────────────────────────

function BotAvatar({ name }: { name: BotName }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold select-none">
        {name[0]}
      </div>
      <span className="text-sm font-medium text-muted">{name}</span>
    </div>
  );
}

// ─── ContinueButton ───────────────────────────────────────────────────────────

function ContinueButton({
  onClick,
  disabled,
  loading,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-xl bg-accent px-4 py-3.5 text-white font-medium hover:opacity-90 transition disabled:opacity-40"
    >
      {loading ? "Saving…" : label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState(1);
  const [animDone, setAnimDone] = useState(false);

  // Collected data
  const [botName, setBotName] = useState<BotName | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [goal, setGoal] = useState("");
  const [hour, setHour] = useState("8");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState("AM");
  const [sendTimeType, setSendTimeType] = useState<SendTimeType>("on");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/login");
    });
  }, [router, supabase]);

  function advance() {
    setAnimDone(false);
    setStep((s) => s + 1);
  }

  function handlePhoneContinue() {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setPhoneError("Please enter a valid phone number.");
      return;
    }
    setPhoneError("");
    advance();
  }

  async function handleTimeSave() {
    setSaving(true);
    setSaveError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const daily_send_time = to24Hour(hour, minute, period);
    const digits = phone.replace(/\D/g, "");

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      bot_name: botName,
      phone: phone.startsWith("+") ? phone : `+${digits}`,
      goal,
      daily_send_time,
      send_time_type: sendTimeType,
      timezone,
      onboarding_completed: true,
    });

    if (error) {
      setSaveError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    advance();
  }

  return (
    <StepShell step={step}>
      {/* ── Step 1: Pick a name ─────────────────────────────────────────────── */}
      {step === 1 && (
        <>
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-3">
              heyits
            </p>
            <h1 className="text-3xl font-bold">Pick a name to begin.</h1>
          </div>
          <div className="flex gap-3">
            {(["Cooper", "Claire"] as BotName[]).map((name) => (
              <button
                key={name}
                onClick={() => {
                  setBotName(name);
                  advance();
                }}
                className="flex-1 rounded-2xl border-2 border-border bg-card py-10 text-xl font-semibold hover:border-accent hover:text-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {name}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Step 2: Greeting ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <>
          <BotAvatar name={botName!} />
          <AnimatedText
            text={`heyits ${botName}. I'm happy to help you on your journey to better journaling.`}
            className="text-2xl font-semibold leading-snug text-center mb-8"
            onDone={() => setAnimDone(true)}
          />
          {animDone && (
            <FadeIn>
              <ContinueButton onClick={advance} />
            </FadeIn>
          )}
        </>
      )}

      {/* ── Step 3: Value prop + phone ───────────────────────────────────────── */}
      {step === 3 && (
        <>
          <AnimatedText
            text="We know that journaling is hard to remember, and getting another notification from another app just gets lost in the noise. That's why we'll live in the place where you actually remember to check — your messages."
            className="text-lg leading-relaxed text-center text-muted mb-8"
            wordDelay={45}
            onDone={() => setAnimDone(true)}
          />
          {animDone && (
            <FadeIn>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium mb-2 text-center"
                  >
                    Your phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePhoneContinue()}
                    className="w-full rounded-xl border border-border px-4 py-3 text-center text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="+1 (555) 000-0000"
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      {phoneError}
                    </p>
                  )}
                </div>
                <ContinueButton onClick={handlePhoneContinue} />
              </div>
            </FadeIn>
          )}
        </>
      )}

      {/* ── Step 4: Goal ─────────────────────────────────────────────────────── */}
      {step === 4 && (
        <>
          <AnimatedText
            text="Why do you want to journal with heyits?"
            className="text-2xl font-semibold text-center mb-8"
            wordDelay={90}
            onDone={() => setAnimDone(true)}
          />
          {animDone && (
            <FadeIn>
              <div className="space-y-3">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`w-full rounded-xl border-2 px-5 py-4 text-left text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
                      goal === g
                        ? "border-accent bg-accent-light text-accent"
                        : "border-border bg-card hover:border-accent/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <div className="pt-1">
                  <ContinueButton onClick={advance} disabled={!goal} />
                </div>
              </div>
            </FadeIn>
          )}
        </>
      )}

      {/* ── Step 5: Send time ────────────────────────────────────────────────── */}
      {step === 5 && (
        <>
          <AnimatedText
            text="What time of day will be best to message you?"
            className="text-2xl font-semibold text-center mb-8"
            wordDelay={80}
            onDone={() => setAnimDone(true)}
          />
          {animDone && (
            <FadeIn>
              <div className="space-y-6">
                {/* Time picker */}
                <div className="flex items-center justify-center gap-2">
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="rounded-xl border border-border px-3 py-3 text-xl font-semibold text-center bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(
                      (h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      )
                    )}
                  </select>
                  <span className="text-2xl font-bold text-muted">:</span>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="rounded-xl border border-border px-3 py-3 text-xl font-semibold text-center bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="00">00</option>
                    <option value="30">30</option>
                  </select>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="rounded-xl border border-border px-3 py-3 text-xl font-semibold text-center bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>

                {/* On / Around toggle */}
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted">Message me…</p>
                  <div className="flex rounded-xl border border-border p-1 bg-card gap-1">
                    {(["on", "around"] as SendTimeType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSendTimeType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none ${
                          sendTimeType === type
                            ? "bg-accent text-white shadow-sm"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        {type === "on" ? "On time" : "Around this time"}
                      </button>
                    ))}
                  </div>
                  {sendTimeType === "around" && (
                    <p className="text-xs text-muted text-center leading-relaxed">
                      We&apos;ll message you within 20 minutes of this time —
                      different each day.
                    </p>
                  )}
                </div>

                {saveError && (
                  <p className="text-sm text-red-600 text-center">{saveError}</p>
                )}

                <ContinueButton onClick={handleTimeSave} loading={saving} />
              </div>
            </FadeIn>
          )}
        </>
      )}

      {/* ── Step 6: Google Calendar ───────────────────────────────────────────── */}
      {step === 6 && (
        <>
          <BotAvatar name={botName!} />
          <AnimatedText
            text="I'll check your calendar for you so I know what to ask you about each day."
            className="text-2xl font-semibold leading-snug text-center mb-8"
            onDone={() => setAnimDone(true)}
          />
          {animDone && (
            <FadeIn>
              <div className="space-y-3">
                <a
                  href="/api/auth/google"
                  className="block w-full rounded-xl bg-accent px-4 py-3.5 text-white font-medium text-center hover:opacity-90 transition"
                >
                  Connect Google Calendar
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted hover:text-foreground transition"
                >
                  Skip for now
                </button>
              </div>
            </FadeIn>
          )}
        </>
      )}
    </StepShell>
  );
}
