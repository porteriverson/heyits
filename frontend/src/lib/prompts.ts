import { createAdminClient } from "./supabaseServer";
import { refreshAccessToken, getTodayEvents } from "./google";
import { generatePromptFromCalendar } from "./gemini";

type AdminClient = ReturnType<typeof createAdminClient>;

interface UserProfile {
  google_connected: boolean | null;
  google_refresh_token: string | null;
  timezone: string;
}

export interface GeneratedPrompt {
  promptText: string;
  promptTitle: string;
}

function titleFromPromptText(text: string): string {
  // Take up to 6 words, strip trailing question mark/punctuation
  const words = text
    .replace(/[?!.]+$/, "")
    .split(/\s+/)
    .slice(0, 6);
  return words.join(" ");
}

export async function generatePrompt(
  supabase: AdminClient,
  user: UserProfile,
): Promise<GeneratedPrompt> {
  if (user.google_connected && user.google_refresh_token) {
    try {
      const { access_token } = await refreshAccessToken(
        user.google_refresh_token,
      );
      const events = await getTodayEvents(access_token, user.timezone);

      if (events.length > 0) {
        if (process.env.GEMINI_API_KEY) {
          const { prompt, title } = await generatePromptFromCalendar(events);
          return { promptText: prompt, promptTitle: title };
        }
        // Fallback if no Gemini key: use first event name directly
        if (events[0].summary) {
          const promptText = `How did ${events[0].summary} go today?`;
          return { promptText, promptTitle: events[0].summary };
        }
      }
    } catch (err) {
      console.error("Prompt generation (calendar/Gemini) failed:", err);
      // Fall through to random prompt
    }
  }

  // Random fallback prompt from DB
  const { data } = await supabase.from("prompts").select("prompt_text");
  const promptText = data?.length
    ? data[Math.floor(Math.random() * data.length)].prompt_text
    : "What's one thing from today that's still on your mind?";

  return { promptText, promptTitle: titleFromPromptText(promptText) };
}
