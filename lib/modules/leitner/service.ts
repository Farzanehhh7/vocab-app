/**
 * Leitner Review Service — 🔑 قلب کل پروژه
 * پیاده‌سازی واقعی الگوریتم بخش ۵ سند معماری (leitner-platform-architecture.md)
 *
 * این فایل عمداً بدون وابستگی به Next.js نوشته شده (فقط Prisma) تا:
 *  ۱. به‌راحتی Unit Test بشه (بدون نیاز به شبیه‌سازی Request/Response)
 *  ۲. طبق قانون ۰ نقشه راه Solo-Founder، روزی که خواستی این ماژول رو به یک
 *     سرویس مستقل (مثلاً NestJS) منتقل کنی، همین فایل تقریباً بدون تغییر
 *     قابل کپی باشه.
 */
import type { PrismaClient } from "@prisma/client";
import { addDays } from "@/lib/utils/date";
import { renderCardTemplate, escapeHtml } from "@/lib/modules/notes-cards/template-renderer";
import type {
  ReviewGrade,
  ReviewQueueItem,
  SubmitReviewResult,
  BoxSummaryItem,
} from "./types";

const MAX_BOX = 5;
const MIN_BOX = 1;
const EXAMPLES_SHOWN_PER_REVIEW = 2;

/**
 * متن اصلی هر Note رو برای تلفظ صوتی (Web Speech API) استخراج می‌کند —
 * مستقل از نوع Note Type (واژه ساده، Cloze، و غیره در آینده).
 */
function extractPrimaryText(fieldValues: Record<string, unknown>): string {
  const candidateKeys = ["front", "text_with_cloze", "collocation"];
  for (const key of candidateKeys) {
    const value = fieldValues[key];
    if (typeof value === "string" && value.trim()) {
      // حذف نشانه‌گذاری Cloze مثل {{c1::word}} → فقط "word"
      return value.replace(/\{\{c\d+::([^}]+)\}\}/g, "$1");
    }
  }
  // fallback: اولین فیلد متنی موجود
  const firstString = Object.values(fieldValues).find((v) => typeof v === "string");
  return typeof firstString === "string" ? firstString : "";
}

function pickRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

/**
 * 🔑 جلوگیری از حفظ‌کردن مکانیکی (طبق DECISIONS.md ورودی ۰۰۸):
 * اگر Note یک فیلد آرایه‌ای «examples» داشته باشه، هر بار مرور، یک زیرمجموعه
 * تصادفی (نه همیشه همون مثال ثابت) انتخاب و به‌صورت لیست HTML امن (Escape‌شده)
 * برمی‌گردونه تا تو Template با {{{examples_html}}} (خام) جای‌گذاری بشه.
 */
export function buildDynamicFields(fieldValues: Record<string, unknown>): Record<string, unknown> {
  const examples = fieldValues.examples;
  if (!Array.isArray(examples) || examples.length === 0) {
    return fieldValues;
  }

  const selected = pickRandomSubset(
    examples.filter((e): e is string => typeof e === "string" && e.trim().length > 0),
    EXAMPLES_SHOWN_PER_REVIEW
  );

  const examplesHtml =
    '<ul style="text-align:right;font-size:14px;color:var(--muted,#6b7280);margin-top:14px;padding-inline-start:20px;line-height:1.9;">' +
    selected.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("") +
    "</ul>";

  return { ...fieldValues, examples_html: examplesHtml };
}

/** محاسبه جعبه بعدی بر اساس grade — طبق بخش ۵.۲ سند معماری */
export function calculateNextBox(currentBox: number, grade: ReviewGrade): number {
  switch (grade) {
    case "again":
      return MIN_BOX;
    case "hard":
      return Math.max(currentBox - 1, MIN_BOX);
    case "good":
      return Math.min(currentBox + 1, MAX_BOX);
    case "easy":
      return Math.min(currentBox + 2, MAX_BOX);
  }
}

/** آیا این پاسخ به‌معنی "بلدم" است؟ (برای simpleResult و correctStreak) */
export function isKnownGrade(grade: ReviewGrade): boolean {
  return grade === "good" || grade === "easy";
}

export class LeitnerService {
  constructor(private prisma: PrismaClient) {}

  /** بازه روز هر جعبه رو برمی‌گردونه (اول اختصاصی Deck، وگرنه global) */
  private async getIntervalForBox(deckId: string, boxNumber: number): Promise<number> {
    const deckSpecific = await this.prisma.leitnerBoxInterval.findFirst({
      where: { deckId, boxNumber },
    });
    if (deckSpecific) return deckSpecific.intervalDays;

    const global = await this.prisma.leitnerBoxInterval.findFirst({
      where: { deckId: null, boxNumber },
    });
    return global?.intervalDays ?? 0;
  }

  /**
   * صف مرور روزانه — بخش ۵.۴ سند معماری
   * کارت‌هایی که status=active و next_review_at <= الان هستند
   */
  async getReviewQueue(userId: string, deckId: string, limit = 50): Promise<ReviewQueueItem[]> {
    const cards = await this.prisma.card.findMany({
      where: {
        userId,
        deckId,
        status: "active",
        nextReviewAt: { lte: new Date() },
      },
      orderBy: { nextReviewAt: "asc" },
      take: limit,
      include: {
        template: true,
        note: true,
      },
    });

    return cards.map((card) => {
      const fieldValues = card.note.fieldValues as Record<string, unknown>;
      const dynamicFields = buildDynamicFields(fieldValues);
      return {
        cardId: card.id,
        currentBox: card.currentBox,
        isFlagged: card.isFlagged,
        frontHtml: renderCardTemplate(card.template.frontTemplate, dynamicFields),
        backHtml: renderCardTemplate(card.template.backTemplate, dynamicFields),
        frontRawText: extractPrimaryText(fieldValues),
      };
    });
  }

  /**
   * 🔑 ثبت نتیجه یک مرور — دقیقاً پیاده‌سازی بخش ۵.۳ سند معماری
   * همه‌چیز در یک تراکنش اتمیک: آپدیت Card + ثبت ReviewLog
   */
  async submitReview(
    userId: string,
    cardId: string,
    grade: ReviewGrade
  ): Promise<SubmitReviewResult> {
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.card.findUniqueOrThrow({ where: { id: cardId } });

      if (card.userId !== userId) {
        throw new Error("این کارت متعلق به این کاربر نیست.");
      }

      const boxBefore = card.currentBox;
      let boxAfter = calculateNextBox(boxBefore, grade);
      let newStatus: "active" | "learned" | "suspended" = card.status as "active" | "suspended" | "learned";

      // اگر در جعبه ۵ بود و دوباره "بلدم" شد → یادگرفته‌شده، خارج از چرخه
      if (isKnownGrade(grade) && boxBefore === MAX_BOX) {
        newStatus = "learned";
        boxAfter = MAX_BOX;
      } else {
        newStatus = "active";
      }

      const intervalDays = await this.getIntervalForBox(card.deckId, boxAfter);
      const nextReviewAt = addDays(new Date(), intervalDays);

      await tx.card.update({
        where: { id: cardId },
        data: {
          currentBox: boxAfter,
          status: newStatus,
          nextReviewAt,
          lastReviewedAt: new Date(),
          correctStreak: isKnownGrade(grade) ? { increment: 1 } : 0,
          totalReviews: { increment: 1 },
        },
      });

      await tx.reviewLog.create({
        data: {
          cardId,
          userId,
          grade,
          simpleResult: isKnownGrade(grade) ? "known" : "unknown",
          boxBefore,
          boxAfter,
          reviewedAt: new Date(),
        },
      });

      return { cardId, boxBefore, boxAfter, newStatus, nextReviewAt };
    });
  }

  /** Undo آخرین مرور — بخش ۵.۳ سند معماری / بخش ۱۲.۴ (قابلیت سبک Anki) */
  async undoLastReview(userId: string, cardId: string): Promise<void> {
    const lastLog = await this.prisma.reviewLog.findFirst({
      where: { cardId, userId },
      orderBy: { reviewedAt: "desc" },
    });
    if (!lastLog) throw new Error("مروری برای Undo کردن پیدا نشد.");

    await this.prisma.$transaction([
      this.prisma.card.update({
        where: { id: cardId },
        data: { currentBox: lastLog.boxBefore, status: "active" },
      }),
      this.prisma.reviewLog.delete({ where: { id: lastLog.id } }),
    ]);
  }

  /** خلاصه تعداد لغت هر جعبه — برای نمایش ۵ کارت جعبه در صفحه اصلی */
  async getBoxSummary(deckId: string): Promise<BoxSummaryItem[]> {
    const labels: Record<number, string> = {
      1: "روزانه",
      2: "۲ روز یکبار",
      3: "۴ روز یکبار",
      4: "۸ روز یکبار",
      5: "۱۶ روز یکبار",
    };

    const counts = await this.prisma.card.groupBy({
      by: ["currentBox"],
      where: { deckId, status: "active" },
      _count: { _all: true },
    });

    const countMap = new Map<number, number>(
      counts.map((c) => [c.currentBox as number, c._count._all as number])
    );

    return [1, 2, 3, 4, 5].map((boxNumber) => ({
      boxNumber,
      wordCount: countMap.get(boxNumber) ?? 0,
      intervalLabel: labels[boxNumber],
    }));
  }

  /**
   * تعلیق/فعال‌سازی یک کارت — طبق بخش ۱۲.۴ سند معماری (قابلیت سبک Anki).
   * کارت معلق از صف مرور روزانه خارج می‌شه ولی داده‌اش حفظ می‌مونه.
   */
  async toggleSuspend(userId: string, cardId: string): Promise<{ status: string }> {
    const card = await this.prisma.card.findUniqueOrThrow({ where: { id: cardId } });
    if (card.userId !== userId) throw new Error("این کارت متعلق به این کاربر نیست.");

    const newStatus = card.status === "suspended" ? "active" : "suspended";
    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus },
    });
    return { status: updated.status };
  }

  /** علامت‌گذاری بصری کارت (بدون تأثیر روی الگوریتم) — طبق بخش ۱۲.۴ سند معماری */
  async toggleFlag(userId: string, cardId: string): Promise<{ isFlagged: boolean }> {
    const card = await this.prisma.card.findUniqueOrThrow({ where: { id: cardId } });
    if (card.userId !== userId) throw new Error("این کارت متعلق به این کاربر نیست.");

    const updated = await this.prisma.card.update({
      where: { id: cardId },
      data: { isFlagged: !card.isFlagged },
    });
    return { isFlagged: updated.isFlagged };
  }

  /**
   * 🔑 Card Browser — جستجو/فیلتر کامل لغات کاربر، مستقل از Deck فعلی.
   * پایه‌ی صفحه /leitner/browse.
   */
  async browseCards(
    userId: string,
    filters: { search?: string; deckId?: string; box?: number; status?: string; flaggedOnly?: boolean }
  ) {
    type BrowseCardRow = {
      id: string;
      noteId: string;
      currentBox: number;
      status: string;
      isFlagged: boolean;
      note: { fieldValues: unknown };
      deck: { name: string };
    };

    const cards: BrowseCardRow[] = await this.prisma.card.findMany({
      where: {
        userId,
        ...(filters.deckId && { deckId: filters.deckId }),
        ...(filters.box && { currentBox: filters.box }),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.flaggedOnly && { isFlagged: true }),
      },
      include: { note: true, deck: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const filtered: BrowseCardRow[] = filters.search
      ? cards.filter((c) => {
          const fv = c.note.fieldValues as Record<string, unknown>;
          const text = JSON.stringify(fv).toLowerCase();
          return text.includes(filters.search!.toLowerCase());
        })
      : cards;

    return filtered.map((c) => ({
      cardId: c.id,
      noteId: c.noteId,
      deckName: c.deck.name,
      currentBox: c.currentBox,
      status: c.status,
      isFlagged: c.isFlagged,
      fieldValues: c.note.fieldValues as Record<string, unknown>,
    }));
  }
}
