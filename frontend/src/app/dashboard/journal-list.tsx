"use client";

interface Entry {
  id: string;
  content: string;
  event_summary: string | null;
  created_at: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function JournalList({ entries }: { entries: Entry[] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-xl border border-border bg-card p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs text-muted">
            <time>{formatDate(entry.created_at)}</time>
            <span>·</span>
            <time>{formatTime(entry.created_at)}</time>
            {entry.event_summary && (
              <>
                <span>·</span>
                <span className="rounded-full bg-accent-light text-accent px-2 py-0.5 text-xs font-medium">
                  {entry.event_summary}
                </span>
              </>
            )}
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {entry.content}
          </p>
        </article>
      ))}
    </div>
  );
}
