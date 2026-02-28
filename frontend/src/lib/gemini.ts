import { GoogleGenAI } from "@google/genai";

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

interface CalendarEvent {
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

function formatEventList(events: CalendarEvent[]): string {
  return events
    .filter((e) => e.summary)
    .map((e) => {
      const start = e.start?.dateTime ?? e.start?.date;
      const time = start
        ? new Date(start).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })
        : null;
      return time ? `- ${e.summary} (${time})` : `- ${e.summary}`;
    })
    .join("\n");
}

export interface GeneratedPrompt {
  prompt: string;
  title: string;
}

export async function generatePromptFromCalendar(
  events: CalendarEvent[]
): Promise<GeneratedPrompt> {
  const eventList = formatEventList(events);

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `Here are my calendar events for today:\n${eventList}`,
    config: {
      systemInstruction: `You are an AI historian helping a user document their life for future generations. Analyze their Google Calendar data. Identify a unique event, a person they met with, or a recurring location they visited. Generate a question that asks the user to describe the 'human' side of that event—the smells, the specific atmosphere, or the people—in a way that provides context for someone reading this 50 years from now. This question should only be one sentence and the prompt should be at max 15 words.

Return a JSON object with exactly two fields:
- "prompt": one sentence ending with a question mark. Be specific — reference actual events. Be emotionally resonant and open-ended. Keep it conversational, like a friend asking.
- "title": a 3-5 word noun phrase summarising the day's main events (e.g. "Team standup & lunch"). No punctuation at the end.

Output only valid JSON, nothing else.`,
      maxOutputTokens: 200,
      temperature: 1.0,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned empty response");

  try {
    const json = JSON.parse(text.replace(/^```json\n?|```$/g, "").trim());
    if (!json.prompt || !json.title) throw new Error("Missing fields");
    return { prompt: json.prompt.trim(), title: json.title.trim() };
  } catch {
    // If Gemini doesn't return valid JSON, treat the whole text as the prompt
    return {
      prompt: text,
      title: events
        .filter((e) => e.summary)
        .slice(0, 2)
        .map((e) => e.summary!)
        .join(" & ") || "Today",
    };
  }
}
