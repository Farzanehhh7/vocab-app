"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const NOTE_TYPE_ID = "useful_sentence";

interface SentenceNote {
  id: string;
  fieldValues: { front: string; examples?: string[]; meaning_en?: string };
  tags: { tag: { name: string } }[];
  cards: { id: string }[];
}

export default function SentencesPage() {
  const [notes, setNotes] = useState<SentenceNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newSentence, setNewSentence] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultDeckId, setDefaultDeckId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/decks")
      .then((res) => res.json())
      .then((data) => {
        const decks = data.decks ?? [];
        const def = decks.find((d: { isDefault: boolean }) => d.isDefault) ?? decks[0];
        if (def) setDefaultDeckId(def.id);
      });
  }, []);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ noteTypeId: NOTE_TYPE_ID });
    if (search) params.set("search", search);
    const res = await fetch(`/api/v1/notes?${params.toString()}`);
    const data = await res.json();
    setNotes(data.notes ?? []);
    setIsLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(loadNotes, 250);
    return () => clearTimeout(timeout);
  }, [loadNotes]);

  async function handleAddSentence(e: React.FormEvent) {
    e.preventDefault();
    if (!newSentence.trim() || !defaultDeckId) return;
    setIsAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/decks/${defaultDeckId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTypeId: NOTE_TYPE_ID,
          fieldValues: { front: newSentence.trim() },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "خطا در ذخیره جمله");
      setNewSentence("");
      loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setIsAdding(false);
    }
  }

  async function updateSentenceText(noteId: string, front: string) {
    await fetch(`/api/v1/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldValues: { front } }),
    });
  }

  async function addExample(noteId: string) {
    const example = prompt("یه مثال کاربرد این جمله بنویس:");
    if (!example?.trim()) return;
    await fetch(`/api/v1/notes/${noteId}/examples`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ example: example.trim() }),
    });
    loadNotes();
  }

  async function addTag(noteId: string, tagName: string) {
    if (!tagName.trim()) return;
    await fetch(`/api/v1/notes/${noteId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagName: tagName.trim() }),
    });
    loadNotes();
  }

  async function promoteToFlashcard(noteId: string) {
    if (!defaultDeckId) return;
    const res = await fetch(`/api/v1/notes/${noteId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deckId: defaultDeckId }),
    });
    if (res.ok) {
      alert("✅ به فلش‌کارت تبدیل شد و به جعبه ۱ اضافه شد.");
      loadNotes();
    }
  }

  async function deleteSentence(noteId: string) {
    if (!confirm("این جمله حذف بشه؟")) return;
    await fetch(`/api/v1/notes/${noteId}`, { method: "DELETE" });
    loadNotes();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">جملات کاربردی من</h1>
        <Link href="/leitner" className="text-sm text-brand underline">
          بازگشت
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        اینجا فقط یه بانکه — تا خودت نخوای «تبدیل به فلش‌کارت» نکنی، هیچی وارد چرخه مرور نمی‌شه.
      </p>

      <form onSubmit={handleAddSentence} className="mb-6 flex gap-2">
        <input
          value={newSentence}
          onChange={(e) => setNewSentence(e.target.value)}
          placeholder="یه جمله کاربردی جدید بنویس..."
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={isAdding || !newSentence.trim()}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-50"
        >
          {isAdding ? "..." : "افزودن"}
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-box-1">{error}</p>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="جستجو در متن یا تگ..."
        className="input mb-4 w-full"
      />

      {isLoading ? (
        <p className="text-center text-sm text-muted">در حال بارگذاری...</p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          هنوز جمله‌ای اضافه نکردی.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-2xl border border-border bg-surface p-4">
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateSentenceText(note.id, e.currentTarget.textContent ?? "")}
                className="mb-2 rounded-lg border border-dashed border-transparent p-1 text-[15px] outline-none focus:border-accent"
              >
                {note.fieldValues.front}
              </div>

              {note.fieldValues.examples && note.fieldValues.examples.length > 0 && (
                <div className="mb-2 space-y-1 text-xs text-muted">
                  {note.fieldValues.examples.map((ex, i) => (
                    <div key={i}>مثال: {ex}</div>
                  ))}
                </div>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {note.tags.map((t) => (
                  <span key={t.tag.name} className="rounded-full bg-background px-2.5 py-0.5 text-[11px] text-muted">
                    #{t.tag.name}
                  </span>
                ))}
                <input
                  placeholder="+ تگ"
                  className="w-20 rounded-full border border-border bg-transparent px-2 py-0.5 text-[11px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTag(note.id, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => addExample(note.id)} className="rounded-lg border border-border px-2.5 py-1 text-muted">
                  + مثال
                </button>
                {note.cards.length === 0 ? (
                  <button
                    onClick={() => promoteToFlashcard(note.id)}
                    className="rounded-lg bg-brand px-2.5 py-1 font-semibold text-brand-foreground"
                  >
                    تبدیل به فلش‌کارت
                  </button>
                ) : (
                  <span className="rounded-lg bg-background px-2.5 py-1 text-muted">✅ فلش‌کارت شده</span>
                )}
                <button onClick={() => deleteSentence(note.id)} className="rounded-lg border border-border px-2.5 py-1 text-muted">
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
