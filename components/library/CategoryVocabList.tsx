"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryVocabItem {
  id: string;
  term: string;
  meaningFa: string;
  exampleEn: string | null;
  lessonId: string;
  lessonTitle: string;
}
interface DeckOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

export function CategoryVocabList({
  vocabItems,
  decks,
}: {
  vocabItems: CategoryVocabItem[];
  decks: DeckOption[];
}) {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const preferredDeckId = decks.find((d) => d.isDefault)?.id ?? decks[0]?.id;

  async function addToFlashcard(vocab: CategoryVocabItem) {
    if (!preferredDeckId) return;
    const res = await fetch(`/api/v1/decks/${preferredDeckId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteTypeId: "basic_word",
        fieldValues: { front: vocab.term, meaning_fa: vocab.meaningFa, example_en: vocab.exampleEn ?? undefined },
      }),
    });
    if (res.ok) setAddedIds((prev) => new Set(prev).add(vocab.id));
  }

  return (
    <div className="space-y-2">
      {vocabItems.map((v) => {
        const added = addedIds.has(v.id);
        return (
          <div key={v.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
            <div>
              <div>
                <span className="font-medium">{v.term}</span>
                <span className="mr-2 text-xs text-muted">{v.meaningFa}</span>
              </div>
              <Link href={`/library/lessons/${v.lessonId}`} className="text-xs text-brand underline">
                از درس: {v.lessonTitle}
              </Link>
            </div>
            <button
              onClick={() => addToFlashcard(v)}
              disabled={added}
              className="rounded-lg border border-brand px-2.5 py-1 text-xs font-semibold text-brand disabled:opacity-50"
            >
              {added ? "✅ اضافه شد" : "+ فلش‌کارت"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
