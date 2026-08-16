"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  computeHighlightSegments,
  HIGHLIGHT_STYLES,
  type HighlightRange,
} from "@/lib/modules/library/render";

export interface ContentBlock {
  type: "paragraph" | "language_help" | "section_label";
  text: string;
  title?: string;
}
export interface VocabItem {
  id: string;
  term: string;
  meaningFa: string;
  exampleEn: string | null;
}
export interface HighlightData {
  id: string;
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  style: string;
}
export interface LessonData {
  id: string;
  title: string;
  unitCode: string | null;
  source: { id: string; title: string };
  contentBlocks: ContentBlock[];
  vocabItems: VocabItem[];
  highlights: HighlightData[];
}
interface DeckOption {
  id: string;
  name: string;
  isDefault?: boolean;
}
interface SelectionPopupState {
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  top: number;
  left: number;
}

/** پیدا کردن نزدیک‌ترین عنصر جد که data-block-index داره */
function findBlockElement(node: Node): HTMLElement | null {
  let el: Node | null = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  while (el instanceof HTMLElement) {
    if (el.dataset.blockIndex !== undefined) return el;
    el = el.parentElement;
  }
  return null;
}

/** آفست یک نقطه از Selection رو نسبت به متن ساده کل بلوک محاسبه می‌کنه */
function getPlainTextOffset(container: HTMLElement, targetNode: Node, targetOffset: number): number {
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === targetNode) return total + targetOffset;
    total += node.textContent?.length ?? 0;
  }
  return total;
}

export function LessonReader({ lesson, decks }: { lesson: LessonData; decks: DeckOption[] }) {
  const [highlights, setHighlights] = useState<HighlightData[]>(lesson.highlights);
  const [armedStyle, setArmedStyle] = useState<string | null>(null);
  const [popup, setPopup] = useState<SelectionPopupState | null>(null);
  const [isSavingSentence, setIsSavingSentence] = useState(false);
  const [addedVocabIds, setAddedVocabIds] = useState<Set<string>>(new Set());
  const popupRef = useRef<HTMLDivElement>(null);

  const preferredDeckId = decks.find((d) => d.isDefault)?.id ?? decks[0]?.id;

  useEffect(() => {
    function handleDocMouseDown(e: MouseEvent) {
      if (popup && popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPopup(null);
      }
    }
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, [popup]);

  async function applyHighlight(blockIndex: number, startOffset: number, endOffset: number, style: string) {
    const res = await fetch(`/api/v1/lessons/${lesson.id}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockIndex, startOffset, endOffset, style }),
    });
    if (res.ok) {
      const data = await res.json();
      setHighlights((prev) => [...prev, data.highlight]);
    }
  }

  function removeHighlight(id: string) {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    fetch(`/api/v1/highlights/${id}`, { method: "DELETE" });
  }

  function handleMouseUp() {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!selection || !text || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const blockEl = findBlockElement(range.startContainer);
    if (!blockEl) return;
    const blockIndex = Number(blockEl.dataset.blockIndex);

    const startOffset = getPlainTextOffset(blockEl, range.startContainer, range.startOffset);
    const endOffset = getPlainTextOffset(blockEl, range.endContainer, range.endOffset);
    if (startOffset >= endOffset) return;

    if (armedStyle) {
      applyHighlight(blockIndex, startOffset, endOffset, armedStyle);
      selection.removeAllRanges();
      return;
    }

    const rect = range.getBoundingClientRect();
    setPopup({
      blockIndex,
      startOffset,
      endOffset,
      text,
      top: window.scrollY + rect.bottom + 8,
      left: window.scrollX + rect.left,
    });
  }

  async function addSelectionToSentenceBank() {
    if (!popup || !preferredDeckId) return;
    setIsSavingSentence(true);
    await fetch(`/api/v1/decks/${preferredDeckId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteTypeId: "useful_sentence", fieldValues: { front: popup.text } }),
    });
    setIsSavingSentence(false);
    setPopup(null);
    window.getSelection()?.removeAllRanges();
  }

  async function addVocabToFlashcard(vocab: VocabItem) {
    if (!preferredDeckId) return;
    const res = await fetch(`/api/v1/decks/${preferredDeckId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteTypeId: "basic_word",
        fieldValues: { front: vocab.term, meaning_fa: vocab.meaningFa, example_en: vocab.exampleEn ?? undefined },
      }),
    });
    if (res.ok) setAddedVocabIds((prev) => new Set(prev).add(vocab.id));
  }

  function renderSegments(text: string, ranges: HighlightRange[]) {
    return computeHighlightSegments(text, ranges).map((seg, i) => {
      if (!seg.highlight) return <span key={i}>{seg.text}</span>;
      const isUnderline = seg.highlight.style === "underline";
      const styleInfo = HIGHLIGHT_STYLES.find((s) => s.id === seg.highlight!.style);
      return (
        <span
          key={i}
          onClick={() => removeHighlight(seg.highlight!.id)}
          title="برای حذف کلیک کن"
          className={
            isUnderline
              ? "cursor-pointer underline decoration-brand decoration-2 underline-offset-4"
              : `cursor-pointer rounded ${styleInfo?.markClass ?? "bg-yellow-200"}`
          }
        >
          {seg.text}
        </span>
      );
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 text-xs text-muted">
        <Link href="/library" className="text-brand underline">
          کتابخانه
        </Link>{" "}
        / {lesson.source.title} / {lesson.unitCode ?? lesson.title}
      </div>

      <h1 className="mb-5 text-xl font-bold">{lesson.title}</h1>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3">
        <span className="text-xs text-muted">🖍️ ابزار:</span>
        {HIGHLIGHT_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setArmedStyle((prev) => (prev === s.id ? null : s.id))}
            title={s.label}
            className={`h-6 w-6 rounded-full ${s.swatchClass} ${
              armedStyle === s.id ? "ring-2 ring-foreground ring-offset-2" : ""
            }`}
          />
        ))}
        {armedStyle && (
          <>
            <span className="text-xs font-medium text-brand">روشنه — رو متن Select کن</span>
            <button
              onClick={() => setArmedStyle(null)}
              className="rounded-lg border border-border px-2 py-1 text-xs text-muted"
            >
              ✕ خاموش
            </button>
          </>
        )}
      </div>

      <div onMouseUp={handleMouseUp} className="mb-8 select-text">
        {lesson.contentBlocks.map((block, blockIndex) => {
          const blockHighlights = highlights.filter((h) => h.blockIndex === blockIndex);

          if (block.type === "section_label") {
            return (
              <span
                key={blockIndex}
                className="mb-2 inline-block rounded-md bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-foreground"
              >
                {block.text}
              </span>
            );
          }
          if (block.type === "language_help") {
            return (
              <div key={blockIndex} className="my-4 rounded-xl border border-border bg-accent/5 p-4 text-sm">
                <span className="mb-1 block text-xs font-bold uppercase text-accent">{block.title}</span>
                <p data-block-index={blockIndex} className="leading-8">
                  {renderSegments(block.text, blockHighlights)}
                </p>
              </div>
            );
          }
          return (
            <p key={blockIndex} data-block-index={blockIndex} className="mb-3 whitespace-pre-line text-[15px] leading-9">
              {renderSegments(block.text, blockHighlights)}
            </p>
          );
        })}
      </div>

      {popup && (
        <div
          ref={popupRef}
          className="fixed z-50 w-56 rounded-xl bg-foreground p-3 text-white shadow-xl"
          style={{ top: popup.top, left: popup.left }}
        >
          <div className="mb-2 flex gap-1.5">
            {HIGHLIGHT_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  applyHighlight(popup.blockIndex, popup.startOffset, popup.endOffset, s.id);
                  setPopup(null);
                  window.getSelection()?.removeAllRanges();
                }}
                title={s.label}
                className={`h-5 w-5 rounded-full ${s.swatchClass}`}
              />
            ))}
          </div>
          <button
            onClick={addSelectionToSentenceBank}
            disabled={isSavingSentence}
            className="w-full rounded-lg bg-brand py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-50"
          >
            {isSavingSentence ? "..." : "+ افزودن به جملات کاربردی من"}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold">لغات این درس</h2>
        <div className="space-y-2">
          {lesson.vocabItems.map((v) => {
            const added = addedVocabIds.has(v.id);
            return (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{v.term}</span>
                  <span className="mr-2 text-xs text-muted">{v.meaningFa}</span>
                </div>
                <button
                  onClick={() => addVocabToFlashcard(v)}
                  disabled={added}
                  className="rounded-lg border border-brand px-2.5 py-1 text-xs font-semibold text-brand disabled:opacity-50"
                >
                  {added ? "✅ اضافه شد" : "+ فلش‌کارت"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
