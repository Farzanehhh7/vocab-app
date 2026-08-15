"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toPersianDigits } from "@/components/leitner/BoxCard";

interface BrowserCard {
  cardId: string;
  noteId: string;
  deckName: string;
  currentBox: number;
  status: string;
  isFlagged: boolean;
  fieldValues: { front?: string; meaning_fa?: string };
}
interface DeckOption {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  suspended: "معلق",
  learned: "یادگرفته‌شده",
};

export default function BrowsePage() {
  const [cards, setCards] = useState<BrowserCard[]>([]);
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [deckId, setDeckId] = useState("");
  const [box, setBox] = useState("");
  const [status, setStatus] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => {
    fetch("/api/v1/decks")
      .then((res) => res.json())
      .then((data) => setDecks(data.decks));
  }, []);

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (deckId) params.set("deckId", deckId);
    if (box) params.set("box", box);
    if (status) params.set("status", status);
    if (flaggedOnly) params.set("flaggedOnly", "true");

    const res = await fetch(`/api/v1/cards/browse?${params.toString()}`);
    const data = await res.json();
    setCards(data.cards ?? []);
    setIsLoading(false);
  }, [search, deckId, box, status, flaggedOnly]);

  useEffect(() => {
    const timeout = setTimeout(loadCards, 250); // Debounce برای جستجو
    return () => clearTimeout(timeout);
  }, [loadCards]);

  async function handleSuspend(cardId: string) {
    await fetch(`/api/v1/cards/${cardId}/suspend`, { method: "POST" });
    loadCards();
  }
  async function handleFlag(cardId: string) {
    await fetch(`/api/v1/cards/${cardId}/flag`, { method: "POST" });
    loadCards();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">مرور و مدیریت لغات</h1>
        <Link href="/leitner" className="text-sm text-brand underline">
          بازگشت به داشبورد
        </Link>
      </div>

      {/* فیلترها */}
      <div className="mb-6 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در کلمه/معنی..."
          className="input flex-1 min-w-[180px]"
        />
        <select value={deckId} onChange={(e) => setDeckId(e.target.value)} className="input w-auto">
          <option value="">همه دسته‌ها</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={box} onChange={(e) => setBox(e.target.value)} className="input w-auto">
          <option value="">همه جعبه‌ها</option>
          {[1, 2, 3, 4, 5].map((b) => (
            <option key={b} value={b}>جعبه {toPersianDigits(b)}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="suspended">معلق</option>
          <option value="learned">یادگرفته‌شده</option>
        </select>
        <label className="flex items-center gap-1.5 rounded-xl border border-border px-3 text-sm">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} />
          فقط پرچم‌دارها 🚩
        </label>
      </div>

      {isLoading ? (
        <div className="py-10 text-center text-muted">در حال بارگذاری...</div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          چیزی با این فیلترها پیدا نشد.
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((c) => (
            <div
              key={c.cardId}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFlag(c.cardId)}
                  title="پرچم"
                  className={c.isFlagged ? "text-accent" : "text-border"}
                >
                  🚩
                </button>
                <div>
                  <div className="font-semibold">{c.fieldValues.front}</div>
                  <div className="text-xs text-muted">{c.fieldValues.meaning_fa}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">
                  {c.deckName}
                </span>
                <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">
                  جعبه {toPersianDigits(c.currentBox)}
                </span>
                <span className="rounded-full bg-background px-2 py-1 text-xs text-muted">
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
                <button
                  onClick={() => handleSuspend(c.cardId)}
                  className="rounded-lg border border-border px-2 py-1 text-xs hover:border-brand hover:text-brand"
                >
                  {c.status === "suspended" ? "فعال‌سازی" : "تعلیق"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
