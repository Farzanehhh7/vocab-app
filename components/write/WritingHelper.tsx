"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface TagOption {
  id: string;
  name: string;
  noteCount: number;
}
interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  vocabCount: number;
}
interface PersonalWord {
  noteId: string;
  term: string;
  meaning: string;
  tags: string[];
}
interface SharedWord {
  id: string;
  term: string;
  meaning: string;
  lessonId: string;
  lessonTitle: string;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function WritingHelper({ tags, categories }: { tags: TagOption[]; categories: CategoryOption[] }) {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [personalWords, setPersonalWords] = useState<PersonalWord[]>([]);
  const [sharedWords, setSharedWords] = useState<SharedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasSelection = selectedTags.size > 0 || selectedCategories.size > 0;

  const loadWords = useCallback(async () => {
    if (!hasSelection) return;
    setIsLoading(true);
    const params = new URLSearchParams({
      tags: [...selectedTags].join(","),
      categories: [...selectedCategories].join(","),
    });
    const res = await fetch(`/api/v1/writing-helper?${params.toString()}`);
    const data = await res.json();
    setPersonalWords(data.personalWords ?? []);
    setSharedWords(data.sharedWords ?? []);
    setIsLoading(false);
  }, [selectedTags, selectedCategories, hasSelection]);

  useEffect(() => {
    const timeout = setTimeout(loadWords, 150);
    return () => clearTimeout(timeout);
  }, [loadWords]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">دستیار رایتینگ</h1>
        <Link href="/leitner" className="text-sm text-brand underline">
          بازگشت
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        چند تگ و/یا چند دسته‌بندی رو انتخاب کن — لغات مرتبط از هر دو (بانک شخصی خودت + گلچین‌های مشترک) با هم نشون داده می‌شن.
      </p>

      {tags.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold">تگ‌های شخصی من</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.has(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTags((prev) => toggleInSet(prev, tag.name))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isSelected ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-muted"
                  }`}
                >
                  #{tag.name} ({tag.noteCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold">دسته‌بندی‌های مشترک (گلچین لغات)</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategories.has(cat.slug);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategories((prev) => toggleInSet(prev, cat.slug))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isSelected ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-muted"
                  }`}
                >
                  {cat.name} ({cat.vocabCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          حداقل یه تگ یا دسته‌بندی انتخاب کن تا لغات مرتبطش رو ببینی.
        </div>
      )}

      {isLoading && <p className="text-sm text-muted">در حال جستجو...</p>}

      {hasSelection && !isLoading && (
        <div className="space-y-6">
          {personalWords.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold text-muted">از بانک شخصی من ({personalWords.length})</h3>
              <div className="space-y-1.5">
                {personalWords.map((w) => (
                  <div key={w.noteId} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                    <span className="font-medium">{w.term}</span>
                    {w.meaning && <span className="mr-2 text-xs text-muted">{w.meaning}</span>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {w.tags.map((t) => (
                        <span key={t} className="text-[10px] text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sharedWords.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold text-muted">از گلچین‌های مشترک ({sharedWords.length})</h3>
              <div className="space-y-1.5">
                {sharedWords.map((w) => (
                  <div key={w.id} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
                    <span className="font-medium">{w.term}</span>
                    <span className="mr-2 text-xs text-muted">{w.meaning}</span>
                    <Link href={`/library/lessons/${w.lessonId}`} className="mr-2 text-xs text-brand underline">
                      ({w.lessonTitle})
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {personalWords.length === 0 && sharedWords.length === 0 && (
            <p className="text-center text-sm text-muted">لغتی برای این انتخاب پیدا نشد.</p>
          )}
        </div>
      )}
    </div>
  );
}
