/**
 * heyits local message poller
 *
 * Watches your Mac's Messages database for new inbound messages and saves
 * replies to Supabase via the local dev server.
 *
 * Start:  npm run poller   (from heyits/ root)
 * Stop:   Ctrl+C
 *
 * Requirements:
 *   • Dev server running (npm run dev)
 *   • Terminal (or your terminal app) must have Full Disk Access:
 *     System Settings → Privacy & Security → Full Disk Access → toggle on Terminal/iTerm
 */

import Database from "better-sqlite3";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Load env from frontend/.env.local
config({ path: join(__dirname, "../frontend/.env.local") });

const CHAT_DB = join(homedir(), "Library/Messages/chat.db");
const STATE_FILE = join(__dirname, ".poller-state.json");
const API_URL = process.env.POLLER_API_URL ?? "http://localhost:3000";
const POLLER_SECRET = process.env.POLLER_SECRET ?? "";
const POLL_INTERVAL_MS = 3000;

// Seconds between Unix epoch (1970) and Apple's Cocoa epoch (2001)
const APPLE_EPOCH_OFFSET_S = 978307200;

function loadState() {
  if (existsSync(STATE_FILE)) {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  }
  return { lastRowId: 0 };
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function normalizePhone(raw) {
  if (!raw) return raw;
  // Email addresses (iMessage) — return as-is, won't match phone profiles
  if (raw.includes("@")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return raw;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  return raw;
}

async function poll(db, state) {
  let rows;
  try {
    rows = db
      .prepare(
        `SELECT m.ROWID, m.text, h.id as sender
         FROM message m
         JOIN handle h ON m.handle_id = h.ROWID
         WHERE m.is_from_me = 0
           AND m.text IS NOT NULL
           AND trim(m.text) != ''
           AND m.ROWID > ?
         ORDER BY m.ROWID ASC`,
      )
      .all(state.lastRowId);
  } catch (err) {
    console.error("[poller] DB query failed:", err.message);
    return;
  }

  for (const row of rows) {
    state.lastRowId = row.ROWID;

    const phone = normalizePhone(row.sender);
    const preview = row.text.slice(0, 60).replace(/\n/g, " ");
    console.log(`[poller] ← ${phone}: "${preview}"`);

    try {
      const res = await fetch(`${API_URL}/api/sms/inbound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-poller-secret": POLLER_SECRET,
        },
        body: JSON.stringify({ from: phone, body: row.text }),
      });

      const data = await res.json();

      if (data.saved) {
        console.log(`[poller] ✓ Journal entry saved`);
      } else {
        const reason = data.reason ?? "unknown";
        const reasons = {
          no_pending_prompt: "no pending prompt — send a test first",
          unknown_number: "phone number not in profiles",
          stopped: "user sent STOP",
          started: "user sent START",
        };
        console.log(`[poller] - Skipped (${reasons[reason] ?? reason})`);
      }
    } catch (err) {
      console.error(`[poller] Failed to POST to API: ${err.message}`);
      console.error(`         Is the dev server running at ${API_URL}?`);
    }
  }

  saveState(state);
}

async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║     heyits message poller            ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`API:      ${API_URL}`);
  console.log(`Interval: every ${POLL_INTERVAL_MS / 1000}s`);
  console.log(`Stop:     Ctrl+C\n`);

  let db;
  try {
    db = new Database(CHAT_DB, { readonly: true });
  } catch (err) {
    console.error("✗ Could not open Messages database.");
    console.error("  " + err.message + "\n");
    console.error("  Fix: grant Full Disk Access to your terminal app:");
    console.error(
      "  System Settings → Privacy & Security → Full Disk Access → add Terminal (or iTerm2)",
    );
    process.exit(1);
  }

  const state = loadState();

  if (state.lastRowId === 0) {
    // On first run, snapshot current latest so we don't replay message history
    const latest = db
      .prepare("SELECT COALESCE(MAX(ROWID), 0) as maxId FROM message")
      .get();
    state.lastRowId = latest.maxId;
    saveState(state);
    console.log(`First run — starting from message #${state.lastRowId}`);
    console.log("Waiting for new messages...\n");
  } else {
    console.log(`Resuming from message #${state.lastRowId}\n`);
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[poller] Stopped.");
    process.exit(0);
  });

  setInterval(() => poll(db, state), POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("[poller] Fatal:", err.message);
  process.exit(1);
});
