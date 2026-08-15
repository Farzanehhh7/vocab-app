"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ReviewGrade, ReviewQueueItem } from "@/lib/modules/leitner/types";
import { toPersianDigits } from "./BoxCard";

const ADVANCED_LABELS: Record<ReviewGrade, string> = {
  again: "دوباره",
  hard: "سخت بود",
  good: "بلدم",
  easy: "راحت بود",
};

const ADVANCED_COLORS: Record<ReviewGrade, string> = {
  again: "bg-box-1",
  hard: "bg-box-2",
  good: "bg-box-4",
  easy: "bg-box-5",
};

export function ReviewSession({ deckId }: { deckId: string }) {
  const [queue, setQueue] = useState<ReviewQueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGradedCardId, setLastGradedCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/decks/${deckId}/review-queue`)
      .then((res) => res.json())
      .then((data) => setQueue(data.queue))
      .catch(() => setError("خطا در بارگذاری صف مرور"));

    fetch("/api/v1/me")
      .then((res) => res.json())
      .then((data) => setAdvancedMode(Boolean(data.preferAdvancedGrading)))
      .catch(() => {});
  }, [deckId]);

  const currentCard = queue?.[index];

  const submitGrade = useCallback(
    async (grade: ReviewGrade) => {
      if (!currentCard || isSubmitting) return;
      setIsSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/cards/${currentCard.cardId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grade }),
        });
        if (!res.ok) throw new Error("خطا در ثبت مرور");

        setLastGradedCardId(currentCard.cardId);
        setIsFlipped(false);
        setTimeout(() => setIndex((i) => i + 1), 150);
      } catch {
        setError("مرور ثبت نشد، دوباره امتحان کن.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting]
  );

  const handleUndo = useCallback(async () => {
    if (!lastGradedCardId) return;
    await fetch(`/api/v1/cards/${lastGradedCardId}/undo`, { method: "POST" });
    setIndex((i) => Math.max(i - 1, 0));
    setLastGradedCardId(null);
    setIsFlipped(false);
  }, [lastGradedCardId]);

  const toggleAdvancedMode = useCallback(async () => {
    const next = !advancedMode;
    setAdvancedMode(next);
    await fetch("/api/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferAdvancedGrading: next }),
    });
  }, [advancedMode]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.cancel(); // جلوگیری از صف‌شدن چند تلفظ روی هم
    window.speechSynthesis.speak(utterance);
  }, []);

  // میانبرهای صفحه‌کلید
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((f) => !f);
        return;
      }
      if (!isFlipped) return;

      if (!advancedMode) {
        if (e.code === "ArrowLeft") submitGrade("good");
        else if (e.code === "ArrowRight") submitGrade("again");
      } else {
        if (e.key === "1") submitGrade("again");
        else if (e.key === "2") submitGrade("hard");
        else if (e.key === "3") submitGrade("good");
        else if (e.key === "4") submitGrade("easy");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFlipped, advancedMode, submitGrade]);

  if (queue === null) {
    return <div className="p-10 text-center text-muted">در حال بارگذاری...</div>;
  }

  if (!currentCard) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-2 text-2xl font-bold">مرور امروز تمام شد!</h1>
        <p className="mb-6 text-muted">
          {toPersianDigits(queue.length)} لغت مرور کردی. فردا دوباره سر بزن.
        </p>
        <Link
          href="/leitner"
          className="inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-brand-foreground"
        >
          بازگشت به داشبورد
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col px-6 py-10">
      {/* نوار پیشرفت + تنظیمات */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <span>
            {toPersianDigits(index + 1)} از {toPersianDigits(queue.length)}
          </span>
          <div className="flex items-center gap-3">
            {lastGradedCardId && (
              <button onClick={handleUndo} className="underline hover:text-brand">
                بازگردانی آخرین مرور
              </button>
            )}
            <button onClick={toggleAdvancedMode} className="underline hover:text-brand">
              {advancedMode ? "حالت ساده" : "حالت پیشرفته"}
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${(index / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* خود فلش‌کارت */}
      <div className="flip-scene mb-8 flex-1">
        <div
          className={`flip-card relative h-64 w-full cursor-pointer ${isFlipped ? "is-flipped" : ""}`}
          onClick={() => setIsFlipped((f) => !f)}
        >
          <div className="flip-face flex h-full w-full flex-col items-center justify-center rounded-3xl border border-border bg-surface p-6 text-center shadow-md">
            <button
              onClick={(e) => {
                e.stopPropagation();
                speak(currentCard.frontRawText);
              }}
              className="absolute top-4 left-4 rounded-full p-2 text-muted transition hover:bg-background hover:text-brand"
              aria-label="تلفظ صوتی"
              title="تلفظ صوتی"
            >
              🔊
            </button>
            <div
              className="text-2xl font-bold"
              dangerouslySetInnerHTML={{ __html: currentCard.frontHtml }}
            />
            <span className="mt-6 text-xs text-muted">برای دیدن پاسخ کلیک کن یا Space بزن</span>
          </div>
          <div className="flip-face flip-face-back flex h-full w-full flex-col items-center justify-center rounded-3xl border border-brand bg-surface p-6 text-center shadow-md">
            <div
              className="text-lg"
              dangerouslySetInnerHTML={{ __html: currentCard.backHtml }}
            />
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-center text-sm text-box-1">{error}</p>}

      {/* دکمه‌های قضاوت — حالت ساده (۲ دکمه) یا پیشرفته (۴ دکمه، طبق بخش ۵.۲ سند معماری) */}
      {advancedMode ? (
        <div className="grid grid-cols-4 gap-2">
          {(["again", "hard", "good", "easy"] as ReviewGrade[]).map((grade) => (
            <button
              key={grade}
              disabled={!isFlipped || isSubmitting}
              onClick={() => submitGrade(grade)}
              className={`rounded-2xl py-4 text-sm font-bold text-white transition disabled:opacity-30 ${ADVANCED_COLORS[grade]}`}
            >
              {ADVANCED_LABELS[grade]}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            disabled={!isFlipped || isSubmitting}
            onClick={() => submitGrade("again")}
            className="flex-1 rounded-2xl bg-box-1 py-4 font-bold text-white transition disabled:opacity-30"
          >
            بلد نیستم
          </button>
          <button
            disabled={!isFlipped || isSubmitting}
            onClick={() => submitGrade("good")}
            className="flex-1 rounded-2xl bg-box-5 py-4 font-bold text-white transition disabled:opacity-30"
          >
            بلدم
          </button>
        </div>
      )}
    </div>
  );
}
