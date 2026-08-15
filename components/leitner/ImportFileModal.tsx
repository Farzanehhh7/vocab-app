"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParsedRow {
  front: string;
  meaningFa: string;
  exampleEn?: string;
}

/**
 * پارس ساده TXT/CSV — طبق بخش ۲ سند معماری.
 * TXT: هر خط "کلمه<TAB یا کاما>معنی" — ستون سوم اختیاری برای مثال
 * CSV: ردیف اول هدر (front,meaning_fa,example_en)
 *
 * محدودیت شناخته‌شده: پارسر CSV ساده است (کاما داخل گیومه رو پشتیبانی
 * نمی‌کنه) — برای فایل‌های ساده کافیه؛ اگه لازم شد، کتابخانه papaparse
 * رو در فاز بعد اضافه کن.
 */
function parseFile(text: string, isCsv: boolean): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const startIndex = isCsv && /front|word/i.test(lines[0]) ? 1 : 0; // رد کردن هدر CSV

  return lines.slice(startIndex).map((line) => {
    const parts = line.split(isCsv ? "," : /\t|,/).map((p) => p.trim());
    return { front: parts[0] ?? "", meaningFa: parts[1] ?? "", exampleEn: parts[2] };
  });
}

export function ImportFileModal({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  function handleFile(file: File) {
    setError(null);
    setResult(null);
    const isCsv = file.name.toLowerCase().endsWith(".csv");
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseFile(text, isCsv);
      if (parsed.length > 100) {
        setError(`فایل ${parsed.length} ردیف دارد؛ حداکثر ۱۰۰ ردیف در هر ایمپورت مجاز است.`);
        setRows(parsed.slice(0, 100));
      } else {
        setRows(parsed);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/decks/${deckId}/words/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "خطا در ایمپورت");
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای نامشخص");
    } finally {
      setIsSubmitting(false);
    }
  }

  function close() {
    setIsOpen(false);
    setRows([]);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-border px-4 py-2.5 text-sm text-muted transition hover:border-brand hover:text-brand"
      >
        📄 ایمپورت فایل
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={close}>
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold">ایمپورت لغت از فایل</h2>
            <p className="mb-4 text-xs text-muted">
              فایل TXT (هر خط: کلمه TAB معنی) یا CSV (ستون‌های front, meaning_fa,
              example_en) — حداکثر ۱۰۰ لغت هر بار.
            </p>

            {result ? (
              <div className="rounded-xl bg-box-5/10 p-4 text-center">
                <p className="font-semibold">
                  ✅ {result.imported} لغت اضافه شد
                  {result.skipped > 0 && ` (${result.skipped} ردیف نامعتبر رد شد)`}
                </p>
                <button onClick={close} className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm text-brand-foreground">
                  بستن
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept=".txt,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="input mb-4"
                />

                {rows.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-border">
                    {rows.slice(0, 8).map((r, i) => (
                      <div key={i} className="flex justify-between border-b border-border px-3 py-2 text-sm last:border-0">
                        <span className="font-medium">{r.front}</span>
                        <span className="text-muted">{r.meaningFa}</span>
                      </div>
                    ))}
                    {rows.length > 8 && (
                      <div className="px-3 py-2 text-center text-xs text-muted">
                        و {rows.length - 8} ردیف دیگر...
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="mb-3 text-sm text-box-1">{error}</p>}

                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    disabled={rows.length === 0 || isSubmitting}
                    className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground disabled:opacity-50"
                  >
                    {isSubmitting ? "در حال ایمپورت..." : `ایمپورت ${rows.length} لغت`}
                  </button>
                  <button onClick={close} className="rounded-xl border border-border px-4 py-2.5 text-sm">
                    انصراف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
