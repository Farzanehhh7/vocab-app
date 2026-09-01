/**
 * توابع خالص رندر متن درس + Highlight — بدون وابستگی به Prisma یا React،
 * تا هم سمت سرور هم سمت کلاینت قابل استفاده و کاملاً تست‌پذیر باشه.
 *
 * چون Lesson.contentBlocks آرایه‌ای از متن *ساده* است (نه HTML خام)،
 * Highlight فقط یه بازه (blockIndex, startOffset, endOffset) ذخیره
 * می‌کنه. رندر یعنی شکستن متن به بخش‌های Highlight‌شده/نشده — یه تابع
 * خالص ساده، نه دستکاری زنده DOM.
 */

export interface HighlightRange {
  id: string;
  startOffset: number;
  endOffset: number;
  style: string; // color-yellow | color-green | color-blue | color-pink | underline
}

export interface TextSegment {
  text: string;
  highlight: HighlightRange | null;
}

/**
 * متن رو بر اساس بازه‌های Highlight به قطعات پشت‌سرهم می‌شکنه.
 * اگه دو Highlight هم‌پوشانی داشته باشن، بازه دومی که با قبلی تداخل
 * داره کوتاه/نادیده گرفته می‌شه — نه Error، نه رندر خراب.
 */
export function computeHighlightSegments(
  text: string,
  highlights: HighlightRange[]
): TextSegment[] {
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset);
  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const h of sorted) {
    const start = Math.max(h.startOffset, cursor);
    const end = Math.min(h.endOffset, text.length);
    if (start >= end) continue;

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlight: null });
    }
    segments.push({ text: text.slice(start, end), highlight: h });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: null });
  }

  return segments;
}

/** رنگ‌های قابل انتخاب برای Highlight — استفاده مشترک تو Toolbar و رندر */
export const HIGHLIGHT_STYLES: { id: string; label: string; swatchClass: string; markClass: string }[] = [
  { id: "color-yellow", label: "زرد", swatchClass: "bg-yellow-300", markClass: "bg-yellow-200" },
  { id: "color-green", label: "سبز", swatchClass: "bg-green-300", markClass: "bg-green-200" },
  { id: "color-blue", label: "آبی", swatchClass: "bg-blue-300", markClass: "bg-blue-200" },
  { id: "color-pink", label: "صورتی", swatchClass: "bg-pink-300", markClass: "bg-pink-200" },
  { id: "underline", label: "زیرخط", swatchClass: "bg-transparent border-2 border-current", markClass: "" },
];
