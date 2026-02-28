import { jsPDF } from "jspdf";

export interface ExportPhoto {
  url: string;
}

export interface ExportEntry {
  content: string;
  created_at: string | null;
  prompt_title: string | null;
  event_summary: string | null;
  photos: ExportPhoto[];
}

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;
const TITLE_FONT_SIZE = 22;
const MONTH_FONT_SIZE = 14;
const ENTRY_TITLE_FONT_SIZE = 12;
const BODY_FONT_SIZE = 10;
const IMAGE_MAX_WIDTH = 70; // mm
const IMAGE_MAX_HEIGHT = 90; // mm

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\n/);

  doc.setFontSize(fontSize);
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const words = para.split(/\s+/).filter(Boolean);
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = doc.getTextWidth(testLine);
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (i < paragraphs.length - 1 && paragraphs[i + 1]?.trim()) {
      lines.push(""); // blank line between paragraphs
    }
  }
  return lines;
}

function getEntryTitle(entry: ExportEntry): string {
  if (entry.prompt_title?.trim()) return entry.prompt_title.trim();
  if (entry.event_summary?.trim()) return entry.event_summary.trim();
  const firstLine = entry.content.split(/\n/)[0]?.trim();
  if (firstLine) return firstLine.length > 60 ? firstLine.slice(0, 57) + "…" : firstLine;
  return "Entry";
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addEntryContent(
  doc: jsPDF,
  text: string,
  y: number,
  fontSize: number
): number {
  const lines = wrapText(doc, text, CONTENT_WIDTH, fontSize);
  doc.setFontSize(fontSize);
  for (const line of lines) {
    if (y > PAGE_HEIGHT - MARGIN - LINE_HEIGHT) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN, y);
    y += LINE_HEIGHT;
  }
  return y;
}

export async function exportJournalToPdf(
  journalName: string,
  entries: ExportEntry[]
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_HEIGHT / 2 - TITLE_FONT_SIZE;

  // Title page
  doc.setFontSize(TITLE_FONT_SIZE);
  doc.setFont("helvetica", "bold");
  const titleLines = wrapText(doc, journalName, CONTENT_WIDTH, TITLE_FONT_SIZE);
  for (const line of titleLines) {
    const textWidth = doc.getTextWidth(line);
    doc.text(line, (PAGE_WIDTH - textWidth) / 2, y);
    y += LINE_HEIGHT + 2;
  }

  doc.addPage();

  // Sort entries by date (oldest first) and group by month
  const sorted = [...entries].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  const byMonth = new Map<string, ExportEntry[]>();
  for (const entry of sorted) {
    const date = entry.created_at ? new Date(entry.created_at) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!byMonth.has(key)) {
      byMonth.set(key, []);
    }
    byMonth.get(key)!.push(entry);
  }

  const monthKeys = Array.from(byMonth.keys()).sort();
  y = MARGIN;

  for (const monthKey of monthKeys) {
    const monthLabel = (() => {
      const [year, month] = monthKey.split("-").map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    })();
    const monthEntries = byMonth.get(monthKey) ?? [];

    // Month header
    if (y > PAGE_HEIGHT - MARGIN - LINE_HEIGHT * 4) {
      doc.addPage();
      y = MARGIN;
    }
    doc.setFontSize(MONTH_FONT_SIZE);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(monthLabel, MARGIN, y);
    y += LINE_HEIGHT + 6;

    for (const entry of monthEntries) {
      // Date
      const dateStr = entry.created_at
        ? new Date(entry.created_at).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";

      if (y > PAGE_HEIGHT - MARGIN - LINE_HEIGHT * 4) {
        doc.addPage();
        y = MARGIN;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(dateStr, MARGIN, y);
      y += LINE_HEIGHT + 2;

      // Short title (prompt_title, event_summary, or first line of content)
      const title = getEntryTitle(entry);
      doc.setFontSize(ENTRY_TITLE_FONT_SIZE);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      y = addEntryContent(doc, title, y, ENTRY_TITLE_FONT_SIZE);
      y += 2;

      // User response
      doc.setFont("helvetica", "normal");
      doc.setFontSize(BODY_FONT_SIZE);
      y = addEntryContent(doc, entry.content, y, BODY_FONT_SIZE);
      y += LINE_HEIGHT;

      // Photos
      for (const photo of entry.photos) {
        if (!photo.url) continue;
        const dataUrl = await fetchImageAsDataUrl(photo.url);
        if (!dataUrl) continue;

        const img = new Image();
        img.src = dataUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Image load failed"));
        });

        const aspect = img.naturalHeight / img.naturalWidth;
        let w = IMAGE_MAX_WIDTH;
        let h = w * aspect;
        if (h > IMAGE_MAX_HEIGHT) {
          h = IMAGE_MAX_HEIGHT;
          w = h / aspect;
        }

        if (y + h > PAGE_HEIGHT - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }

        const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        try {
          doc.addImage(dataUrl, format, MARGIN, y, w, h);
          y += h + LINE_HEIGHT;
        } catch {
          // Skip image if format unsupported (e.g. WebP)
        }
      }

      y += LINE_HEIGHT;
    }

    y += LINE_HEIGHT;
  }

  const safeName = journalName.replace(/[^a-zA-Z0-9\s-]/g, "").trim() || "journal";
  doc.save(`${safeName}-export.pdf`);
}
