"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddWordWithExamplesModal({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [front, setFront] = useState("");
  const [examples, setExamples] = useState<string[]>(["", ""]);
  const [meaningFa, setMeaningFa] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function resetForm() {
    setFront("");
    setExamples(["", ""]);
    setMeaningFa("");
    setNotes("");
    setTagsInput("");
    setError(null);
  }

  function updateExample(index: number, value: string) {
    setExamples((prev) => prev.map((e, i) => (i === index ? value : e)));
  }
  function addExampleRow() {
    setExamples((prev) => [...prev, ""]);
  }
  function removeExampleRow(index: number) {
    setExamples((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSuggestFromAi() {
    if (!front.trim()) {
      setError("اول کلمه رو وارد کن، بعد از AI بخواه مثال بسازه.");
      return;
    }
    setIsSuggesting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/suggest-examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: front, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا در دریافت پیشنهاد AI");
      setExamples(data.examples);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setIsSuggesting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanExamples = examples.map((ex) => ex.trim()).filter(Boolean);
    if (!front.trim() || !meaningFa.trim() || cleanExamples.length === 0) {
      setError("کلمه، حداقل یک مثال، و توضیحات الزامی هستند.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const tagNames = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/v1/decks/${deckId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTypeId: "word_with_examples",
          fieldValues: { front, examples: cleanExamples, meaning_fa: meaningFa, notes },
          tagNames,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در ذخیره لغت");
      }
      resetForm();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-brand-foreground"
      >
        + افزودن با چند مثال
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold">افزودن لغت با چند مثال</h2>
            <p className="mb-4 text-xs text-muted">
              هر بار مرور، از بین مثال‌هایی که وارد می‌کنی، یکی‌دوتاش تصادفی نشون
              داده می‌شه — تا فقط یک جمله رو حفظ نکنی، خودِ کلمه رو یاد بگیری.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="کلمه یا عبارت *">
                <input
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  className="input"
                  placeholder="مثلاً: hesitate"
                  autoFocus
                />
              </Field>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted">مثال‌ها *</span>
                  <button
                    type="button"
                    onClick={handleSuggestFromAi}
                    disabled={isSuggesting}
                    className="rounded-lg bg-accent/10 px-3 py-1 text-xs font-semibold text-accent disabled:opacity-50"
                  >
                    {isSuggesting ? "در حال دریافت..." : "✨ پیشنهاد از AI"}
                  </button>
                </div>
                <div className="space-y-2">
                  {examples.map((ex, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={ex}
                        onChange={(e) => updateExample(i, e.target.value)}
                        className="input"
                        placeholder={`مثال ${i + 1}`}
                      />
                      {examples.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExampleRow(i)}
                          className="rounded-lg px-2 text-muted hover:text-box-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addExampleRow}
                  className="mt-2 text-xs text-brand underline"
                >
                  + مثال دیگر
                </button>
              </div>

              <Field label="توضیحات (پشت کارت) *">
                <input
                  value={meaningFa}
                  onChange={(e) => setMeaningFa(e.target.value)}
                  className="input"
                  placeholder="معنی و توضیح کامل"
                />
              </Field>

              <Field label="نکات تکمیلی (اختیاری)">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  placeholder="ترفند حافظه، نکته گرامری، و..."
                />
              </Field>

              <Field label="تگ‌ها (با کاما جدا کن، اختیاری)">
                <input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="input"
                  placeholder="مثلاً: environment, phrasal-verb"
                />
              </Field>

              {error && <p className="text-sm text-box-1">{error}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : "ثبت لغت"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
