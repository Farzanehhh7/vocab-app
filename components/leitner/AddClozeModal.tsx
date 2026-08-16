"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * کاربر مجبور نیست نحو Cloze استاندارد ({{c1::...}}) رو بلد باشه — دو تا
 * فیلد ساده پر می‌کنه (جمله کامل + عبارتی که باید جای‌خالی بشه)، و همینجا
 * (سمت کلاینت) تبدیلش می‌کنیم به فرمتی که NoteType «cloze_sentence» انتظار
 * داره. اگه عبارت داخل جمله پیدا نشه، قبل از ارسال بهش خبر می‌دیم.
 */
function buildTextWithCloze(sentence: string, target: string): string | null {
  const index = sentence.indexOf(target);
  if (index === -1) return null;
  return sentence.slice(0, index) + `{{c1::${target}}}` + sentence.slice(index + target.length);
}

export function AddClozeModal({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sentence, setSentence] = useState("");
  const [target, setTarget] = useState("");
  const [meaningFa, setMeaningFa] = useState("");

  function resetForm() {
    setSentence("");
    setTarget("");
    setMeaningFa("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanSentence = sentence.trim();
    const cleanTarget = target.trim();

    if (!cleanSentence || !cleanTarget || !meaningFa.trim()) {
      setError("جمله، عبارت جای‌خالی، و معنی الزامی هستند.");
      return;
    }

    const textWithCloze = buildTextWithCloze(cleanSentence, cleanTarget);
    if (!textWithCloze) {
      setError("این عبارت داخل جمله پیدا نشد — دقیقاً همون‌طور که تو جمله نوشتی وارد کن.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/decks/${deckId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteTypeId: "cloze_sentence",
          fieldValues: { text_with_cloze: textWithCloze, meaning_fa: meaningFa.trim() },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "خطا در ذخیره جمله");
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

  const preview =
    target.trim() && sentence.includes(target.trim())
      ? sentence.replace(target.trim(), "▢▢▢")
      : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-brand px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand hover:text-brand-foreground"
      >
        + افزودن جای‌خالی (Cloze)
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
            <h2 className="mb-1 text-lg font-bold">افزودن جمله با جای‌خالی</h2>
            <p className="mb-4 text-xs text-muted">
              یه جمله کامل بنویس، بعد مشخص کن کدوم کلمه/عبارتش موقع مرور جای‌خالی
              بشه — خودمون تبدیلش می‌کنیم.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted">جمله کامل *</span>
                <textarea
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  className="input min-h-[70px]"
                  placeholder="مثلاً: She tend to forget things when she's stressed."
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted">کدوم بخش جای‌خالی بشه؟ *</span>
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="input"
                  placeholder="مثلاً: tend to"
                />
              </label>

              {preview && (
                <div className="rounded-lg bg-background px-3 py-2 text-xs text-muted">
                  پیش‌نمایش جلوی کارت: {preview}
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-muted">معنی کلمه/عبارت هدف *</span>
                <input
                  value={meaningFa}
                  onChange={(e) => setMeaningFa(e.target.value)}
                  className="input"
                  placeholder="مثلاً: عادت داشتن به"
                />
              </label>

              {error && <p className="text-sm text-box-1">{error}</p>}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ذخیره..." : "ثبت جمله"}
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
