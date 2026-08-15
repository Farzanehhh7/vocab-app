import type { BoxSummaryItem } from "@/lib/modules/leitner/types";

const BOX_COLOR_VAR: Record<number, string> = {
  1: "var(--box-1)",
  2: "var(--box-2)",
  3: "var(--box-3)",
  4: "var(--box-4)",
  5: "var(--box-5)",
};

const BOX_ICON: Record<number, string> = {
  1: "🌱",
  2: "🌿",
  3: "🍀",
  4: "🌳",
  5: "🏆",
};

/**
 * رنگ هر جعبه معنادار است، نه تزئینی: قرمز (جعبه ۱ = نیاز فوری به مرور)
 * به‌تدریج به فیروزه‌ای (جعبه ۵ = نزدیک به یادگیری کامل) تغییر می‌کند.
 */
export function BoxCard({ box }: { box: BoxSummaryItem }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center shadow-sm">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{ backgroundColor: `color-mix(in srgb, ${BOX_COLOR_VAR[box.boxNumber]} 18%, white)` }}
      >
        {BOX_ICON[box.boxNumber]}
      </div>
      <div className="text-sm font-semibold">جعبه {toPersianDigits(box.boxNumber)}</div>
      <div className="text-2xl font-bold" style={{ color: BOX_COLOR_VAR[box.boxNumber] }}>
        {toPersianDigits(box.wordCount)}
      </div>
      <div className="text-xs text-muted">{box.intervalLabel}</div>
    </div>
  );
}

export function toPersianDigits(input: number | string): string {
  const map: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
  };
  return String(input).replace(/[0-9]/g, (d) => map[d]);
}
