import { DateTime } from "luxon";
import { createAdminClient } from "./supabaseServer";
import { sendSMS } from "./sms";
import { generatePrompt } from "./prompts";

export async function runScheduler() {
  const supabase = createAdminClient();
  const now = DateTime.utc();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("phone_verified", true);

  if (error || !users) {
    console.error("Scheduler: failed to fetch users", error);
    return { sent: 0, errors: [] as string[] };
  }

  let sent = 0;
  const errors: string[] = [];
  const skipped: string[] = [];

  for (const user of users) {
    try {
      const timeStr = user.daily_send_time;
      if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) {
        errors.push(`User ${user.id}: invalid or missing daily_send_time`);
        continue;
      }
      const userNow = now.setZone(user.timezone || "UTC");
      const [sendHour, sendMinute] = timeStr.split(":").map(Number);

      // Total minutes from midnight for the target send time
      const targetMinutes = sendHour * 60 + sendMinute;
      // Total minutes from midnight for the current time
      const currentMinutes = userNow.hour * 60 + userNow.minute;

      // "on" mode: match within ±1 minute of the exact time
      // "around" mode: match within ±20 minutes, but only if not sent today
      const windowMinutes = user.send_time_type === "around" ? 20 : 1;
      const inWindow =
        Math.abs(currentMinutes - targetMinutes) <= windowMinutes;

      // Skip if already sent today (prevents firing multiple times within the window)
      const alreadySentToday =
        user.last_prompt_sent_at != null &&
        DateTime.fromISO(user.last_prompt_sent_at)
          .setZone(user.timezone)
          .hasSame(userNow, "day");

      if (inWindow && alreadySentToday) {
        skipped.push(
          `User ${user.id}: in window (${timeStr}) but already sent today`,
        );
      }

      if (inWindow && !alreadySentToday) {
        const { promptText, promptTitle } = await generatePrompt(supabase, user);
        await sendSMS(user.phone, promptText);
        await supabase
          .from("profiles")
          .update({
            last_prompt_sent_at: new Date().toISOString(),
            last_prompt_text: promptText,
            last_prompt_title: promptTitle,
          })
          .eq("id", user.id);
        sent++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`User ${user.id}: ${msg}`);
    }
  }

  return { sent, errors, skipped };
}
