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

export async function generatePromptFromCalendar(
  events: CalendarEvent[]
): Promise<string> {
  const eventList = formatEventList(events);

  const ai = getClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: `Here are my calendar events for today:\n${eventList}`,
    config: {
      systemInstruction: `You are a warm, thoughtful journaling coach. A user shares their calendar events for the day and you write them a single reflective journal prompt to help them process and remember their day.

Rules:
- One sentence only, ending with a question mark
- Be specific — reference actual events from their calendar, not generic platitudes
- Be emotionally resonant and open-ended, not just "How was X?"
- Vary your style: sometimes ask about feelings, sometimes about surprises, lessons, connections between events, or what they'd do differently
- Keep it conversational, like a friend asking — not a therapist or a corporate survey
- Do not include any preamble, explanation, or quotes — output only the prompt itself`,
      maxOutputTokens: 120,
      temperature: 1.0,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned empty response");
  return text;
}
