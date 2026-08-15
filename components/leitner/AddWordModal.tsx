"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddWordModal({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [front, setFront] = useState("");
  const [meaningFa, setMeaningFa] = useState("");
  const [exampleEn, setExampleEn] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function resetForm() {
    setFront("");
    setMeaningFa("");
    setExampleEn("");
    setTagsInput("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!front.trim() || !meaningFa.trim()) {
      setError("کلمه و معنی فارسی الزامی هستند.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const tagNames = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/v1/decks/${deckId}/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, meaningFa, exampleEn, tagNames }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در ذخیره لغت");
      }
      resetForm();
      setIsOpen(false);
      router.refresh(); // Server Component داشبورد رو با تعداد جدید Sync می‌کنه
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
        className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-sm transition hover:opacity-90"
      >
        + افزودن لغت
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-bold">افزودن لغت جدید</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="کلمه یا عبارت *">
                <input
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  className="input"
                  placeholder="مثلاً: tend to"
                  autoFocus
                />
              </Field>

              <Field label="معنی فارسی *">
                <input
                  value={meaningFa}
                  onChange={(e) => setMeaningFa(e.target.value)}
                  className="input"
                  placeholder="مثلاً: تمایل داشتن به"
                />
              </Field>

              <Field label="مثال (اختیاری)">
                <input
                  value={exampleEn}
                  onChange={(e) => setExampleEn(e.target.value)}
                  className="input"
                  placeholder="یک جمله نمونه"
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
