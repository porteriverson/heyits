"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Image from "next/image";
import { exportJournalToPdf } from "@/lib/exportPdf";

interface Photo {
  id: string;
  storage_path: string;
  url?: string;
}

export interface Entry {
  id: string;
  content: string;
  event_summary: string | null;
  created_at: string | null;
  prompt_text: string | null;
  prompt_title: string | null;
  photos: Photo[];
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Entry Modal ────────────────────────────────────────────────────────────────

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

interface ModalProps {
  entry?: Entry;
  onSave: (entry: Entry) => void;
  onClose: () => void;
}

function EntryModal({ entry, onSave, onClose }: ModalProps) {
  const isEditing = !!entry;
  const [content, setContent] = useState(entry?.content ?? "");
  const [photos, setPhotos] = useState<Photo[]>(entry?.photos ?? []);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Generate signed URLs for existing photos
  useEffect(() => {
    const load = async () => {
      const updated = await Promise.all(
        (entry?.photos ?? []).map(async (p) => {
          if (p.url) return p;
          const { data } = await supabase.storage
            .from("journal-photos")
            .createSignedUrl(p.storage_path, 3600);
          return { ...p, url: data?.signedUrl };
        })
      );
      setPhotos(updated);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry?.id]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    const previews = allowed.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingPhotos((prev) => [...prev, ...previews]);
  }, []);

  const removePending = (idx: number) => {
    setPendingPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExisting = (photoId: string) => {
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Entry can't be empty.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Delete removed photos
      for (const photoId of deletedPhotoIds) {
        await fetch(`/api/journal/${entry!.id}/photos/${photoId}`, {
          method: "DELETE",
        });
      }

      let savedEntry: Entry;

      if (isEditing) {
        const res = await fetch(`/api/journal/${entry!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const updated = await res.json();
        savedEntry = { ...updated, photos };
      } else {
        const res = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        savedEntry = await res.json();
      }

      // Upload new photos
      const uploadedPhotos: Photo[] = [];
      for (const pending of pendingPhotos) {
        const fd = new FormData();
        fd.append("file", pending.file);
        const res = await fetch(`/api/journal/${savedEntry.id}/photos`, {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const p = await res.json();
          const { data } = await supabase.storage
            .from("journal-photos")
            .createSignedUrl(p.storage_path, 3600);
          uploadedPhotos.push({ ...p, url: data?.signedUrl });
        }
        URL.revokeObjectURL(pending.previewUrl);
      }

      onSave({ ...savedEntry, photos: [...photos, ...uploadedPhotos] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSave();
    }
  };

  const allPhotos = [
    ...photos.map((p) => ({ type: "existing" as const, ...p })),
    ...pendingPhotos.map((p, i) => ({
      type: "pending" as const,
      id: `pending-${i}`,
      previewUrl: p.previewUrl,
      idx: i,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh", animation: "scaleIn 0.15s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h2 className="font-semibold text-base">
            {isEditing ? "Edit entry" : "New entry"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors rounded-lg p-1 -mr-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {isEditing && entry?.prompt_text && (
            <div className="rounded-xl border border-border bg-background/60 px-4 py-3 space-y-1">
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Prompt</p>
              <p className="text-sm leading-relaxed text-foreground/80 italic">{entry.prompt_text}</p>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            rows={6}
            className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
          />

          {/* Photo grid */}
          {allPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.map((p) => (
                <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-background">
                  <Image
                    src={p.type === "existing" ? (p.url ?? "") : p.previewUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    onClick={() =>
                      p.type === "existing"
                        ? removeExisting(p.id)
                        : removePending(p.idx)
                    }
                    className="absolute top-1 right-1 rounded-full bg-foreground/70 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-5 cursor-pointer transition-colors ${
              dragOver
                ? "border-accent bg-accent-light"
                : "border-border hover:border-accent/50 hover:bg-accent-light/30"
            }`}
          >
            <svg className="text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-xs text-muted">
              <span className="text-accent font-medium">Add photos</span> or drag &amp; drop
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />

          {error && (
            <p className="text-sm text-red-500 rounded-lg bg-red-50 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-border">
          <p className="text-xs text-muted hidden sm:block">
            {isEditing ? "" : "⌘↵ to save"}
          </p>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground border border-border hover:border-foreground/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !content.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
              {saving ? "Saving…" : isEditing ? "Save changes" : "Save entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation ────────────────────────────────────────────────────────

interface DeleteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteDialog({ onConfirm, onCancel, deleting }: DeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card shadow-2xl p-6 space-y-4"
        style={{ animation: "scaleIn 0.15s ease-out" }}
      >
        <div className="space-y-1.5">
          <h2 className="font-semibold">Delete this entry?</h2>
          <p className="text-sm text-muted">
            This will permanently remove the entry and any attached photos. This action can&apos;t be undone.
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground border border-border hover:border-foreground/20 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo Lightbox ─────────────────────────────────────────────────────────────

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
        <Image
          src={url}
          alt=""
          fill
          className="object-contain"
          unoptimized
        />
      </div>
    </div>
  );
}

// ── Entry Card ─────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: Entry;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  return (
    <>
      <article className="rounded-xl border border-border bg-card p-5 space-y-3 hover:border-border/80 transition-colors group">
        {/* Header row: title + actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            {entry.prompt_title && (
              <h3 className="font-semibold text-sm leading-snug truncate">{entry.prompt_title}</h3>
            )}
            <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
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
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent-light transition-colors"
              aria-label="Edit entry"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete entry"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>

        {/* Photos */}
        {entry.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {entry.photos.map((photo) =>
              photo.url ? (
                <button
                  key={photo.id}
                  onClick={() => setLightboxUrl(photo.url!)}
                  className="relative aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={photo.url}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ) : null
            )}
          </div>
        )}
      </article>

      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </>
  );
}

// ── Journal Manager ────────────────────────────────────────────────────────────

interface JournalManagerProps {
  initialEntries: Entry[];
  journalName?: string;
}

export default function JournalManager({ initialEntries, journalName = "Your Journal" }: JournalManagerProps) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [modalState, setModalState] = useState<
    | { mode: "create" }
    | { mode: "edit"; entry: Entry }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  // Hydrate signed URLs for all photo paths on mount
  useEffect(() => {
    const hydrate = async () => {
      const updated = await Promise.all(
        initialEntries.map(async (entry) => {
          if (entry.photos.length === 0) return entry;
          const hydratedPhotos = await Promise.all(
            entry.photos.map(async (p) => {
              const { data } = await supabase.storage
                .from("journal-photos")
                .createSignedUrl(p.storage_path, 3600);
              return { ...p, url: data?.signedUrl };
            })
          );
          return { ...entry, photos: hydratedPhotos };
        })
      );
      setEntries(updated);
    };
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = (saved: Entry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      if (exists) {
        return prev.map((e) => (e.id === saved.id ? saved : e));
      }
      return [saved, ...prev];
    });
    setModalState(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/journal/${deleteTarget}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
      setDeleteTarget(null);
    } catch {
      // Entry stays in list on error
    } finally {
      setDeleting(false);
    }
  };

  const deleteEntry = entries.find((e) => e.id === deleteTarget);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const entriesToExport = await Promise.all(
        entries.map(async (e) => {
          const photosWithUrls = await Promise.all(
            (e.photos ?? []).map(async (p) => {
              if (p.url) return { url: p.url };
              const { data } = await supabase.storage
                .from("journal-photos")
                .createSignedUrl(p.storage_path, 3600);
              return data?.signedUrl ? { url: data.signedUrl } : null;
            })
          );
          const photos = photosWithUrls.filter(
            (p): p is { url: string } => !!p
          );
          return {
            content: e.content,
            created_at: e.created_at,
            prompt_title: e.prompt_title,
            event_summary: e.event_summary,
            photos,
          };
        })
      );
      await exportJournalToPdf(journalName, entriesToExport);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Action buttons: New entry (left) + Export PDF (right) */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New entry
        </button>
        <button
          onClick={handleExportPdf}
          disabled={entries.length === 0 || exporting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          {exporting ? "Exporting…" : "Export PDF"}
        </button>
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center mt-4">
          <p className="text-muted text-sm">
            No entries yet. Reply to your next SMS prompt or create one above!
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => setModalState({ mode: "edit", entry })}
              onDelete={() => setDeleteTarget(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modalState?.mode === "create" && (
        <EntryModal onSave={handleSave} onClose={() => setModalState(null)} />
      )}
      {modalState?.mode === "edit" && (
        <EntryModal
          entry={modalState.entry}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </>
  );
}
