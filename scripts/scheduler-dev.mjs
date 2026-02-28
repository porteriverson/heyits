/**
 * heyits local scheduler (dev only)
 *
 * Calls the scheduler API every minute so daily prompts fire without external cron.
 * Run alongside the dev server and poller for full local testing.
 *
 * Start:  npm run scheduler:dev   (from heyits/ root)
 * Stop:   Ctrl+C
 *
 * Requirements:
 *   • Dev server running (npm run dev)
 */

import { join } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

config({ path: join(__dirname, "../frontend/.env.local") });

const API_URL = process.env.POLLER_API_URL ?? "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET ?? "";
const INTERVAL_MS = 60_000;

async function runScheduler() {
  const headers = {
    "Content-Type": "application/json",
    ...(CRON_SECRET && { Authorization: `Bearer ${CRON_SECRET}` }),
  };
  const res = await fetch(`${API_URL}/api/scheduler/run`, {
    method: "POST",
    headers,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  return data;
}

async function tick() {
  try {
    const result = await runScheduler();
    const ts = new Date().toLocaleTimeString();
    if (result.sent > 0) {
      console.log(`[scheduler] ${ts} — Sent ${result.sent} prompt(s)`);
    } else {
      console.log(`[scheduler] ${ts} — Ran (sent: 0)`);
    }
    if (result.errors?.length > 0) {
      result.errors.forEach((e) => console.log("[scheduler]", e));
    }
    if (result.skipped?.length > 0) {
      result.skipped.forEach((s) => console.log("[scheduler] Skipped:", s));
    }
  } catch (err) {
    console.error("[scheduler]", err.message);
    console.error("         Is the dev server running at", API_URL, "?");
  }
}

function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     heyits scheduler (dev)           ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`API:      ${API_URL}`);
  console.log(`Interval: every ${INTERVAL_MS / 1000}s`);
  console.log(`Stop:     Ctrl+C\n`);

  tick(); // run immediately
  setInterval(tick, INTERVAL_MS);
}

main();
