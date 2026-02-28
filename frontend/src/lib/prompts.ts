import { createAdminClient } from "./supabaseServer";
import { refreshAccessToken, getTodayEvents } from "./google";
import { generatePromptFromCalendar } from "./gemini";

type AdminClient = ReturnType<typeof createAdminClient>;

interface UserProfile {
  google_connected: boolean | null;
  google_refresh_token: string | null;
  timezone: string;
}

export async function generatePrompt(
  supabase: AdminClient,
  user: UserProfile
): Promise<string> {
  if (user.google_connected && user.google_refresh_token) {
    try {
      const { access_token } = await refreshAccessToken(
        user.google_refresh_token
      );
      const events = await getTodayEvents(access_token, user.timezone);

      if (events.length > 0) {
        // Use Gemini to craft a personalised prompt from the full day's events
        if (process.env.GEMINI_API_KEY) {
          return await generatePromptFromCalendar(events);
        }
        // Fallback if no Gemini key: use first event name directly
        if (events[0].summary) {
          return `How did ${events[0].summary} go today?`;
        }
      }
    } catch (err) {
      console.error("Prompt generation (calendar/Gemini) failed:", err);
      // Fall through to random prompt
    }
  }

  // Random fallback prompt from DB
  const { data } = await supabase.from("prompts").select("prompt_text");
  if (!data?.length) return "What's one thing from today that's still on your mind?";
  return data[Math.floor(Math.random() * data.length)].prompt_text;
}
