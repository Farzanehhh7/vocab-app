import { describe, it, expect } from "vitest";
import { computeHighlightSegments } from "./render";

describe("computeHighlightSegments — شکستن متن درس به بخش‌های Highlight‌شده", () => {
  it("بدون هیچ Highlight ای، کل متن یک بخش خنثی برمی‌گردد", () => {
    const result = computeHighlightSegments("Hello world", []);
    expect(result).toEqual([{ text: "Hello world", highlight: null }]);
  });

  it("یک Highlight وسط متن رو به ۳ بخش می‌شکنه", () => {
    const result = computeHighlightSegments("Hello world today", [
      { id: "h1", startOffset: 6, endOffset: 11, style: "color-yellow" },
    ]);
    expect(result).toEqual([
      { text: "Hello ", highlight: null },
      { text: "world", highlight: { id: "h1", startOffset: 6, endOffset: 11, style: "color-yellow" } },
      { text: " today", highlight: null },
    ]);
  });

  it("Highlight دقیقاً از ابتدای متن، بخش خالی قبلش نمی‌سازه", () => {
    const result = computeHighlightSegments("Hello world", [
      { id: "h1", startOffset: 0, endOffset: 5, style: "underline" },
    ]);
    expect(result[0]).toEqual({
      text: "Hello",
      highlight: { id: "h1", startOffset: 0, endOffset: 5, style: "underline" },
    });
  });

  it("چند Highlight غیرهم‌پوشان رو به ترتیب درست می‌سازه", () => {
    const result = computeHighlightSegments("A B C D", [
      { id: "h2", startOffset: 4, endOffset: 5, style: "color-green" },
      { id: "h1", startOffset: 0, endOffset: 1, style: "color-yellow" },
    ]);
    expect(result.map((s) => s.text)).toEqual(["A", " B ", "C", " D"]);
  });

  it("هم‌پوشانی بین دو Highlight رو بدون Error مدیریت می‌کنه (دومی کوتاه/نادیده گرفته می‌شه)", () => {
    const result = computeHighlightSegments("Hello world", [
      { id: "h1", startOffset: 0, endOffset: 8, style: "color-yellow" },
      { id: "h2", startOffset: 3, endOffset: 6, style: "color-green" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].highlight?.id).toBe("h1");
  });

  it("متن خالی، آرایه خالی برمی‌گردونه", () => {
    expect(computeHighlightSegments("", [])).toEqual([]);
  });
});
