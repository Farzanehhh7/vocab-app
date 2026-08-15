import type { PrismaClient } from "@prisma/client";

interface CreateManualNoteInput {
  userId: string;
  deckId: string;
  front: string;
  meaningFa: string;
  exampleEn?: string;
  tagNames?: string[]; // برچسب‌های آزاد؛ اگر تگ وجود نداشت ساخته می‌شود
}

export interface CreateNoteInput {
  userId: string;
  deckId: string;
  noteTypeId: string;
  fieldValues: Record<string, unknown>;
  tagNames?: string[];
}

export class NotesCardsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 🔑 ساخت عمومی Note برای هر Note Type — این متد دقیقاً همون چیزیه که
   * باعث می‌شه افزودن یه نوع فلش‌کارت جدید (مثل «واژه با چند مثال» در
   * DECISIONS.md ورودی ۰۰۸) بدون تغییر ساختار دیتابیس ممکن باشه؛ فقط یک
   * NoteType/CardTemplate جدید Seed می‌شه و همین متد بدون تغییر کار می‌کنه.
   */
  async createNote(input: CreateNoteInput) {
    const { userId, deckId, noteTypeId, fieldValues, tagNames = [] } = input;

    const noteType = await this.prisma.noteType.findUniqueOrThrow({
      where: { id: noteTypeId },
      include: { templates: { where: { isActive: true } } },
    });

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: { userId, noteTypeId: noteType.id, fieldValues, source: "manual" },
      });

      // اتصال/ساخت تگ‌ها (Many-to-Many روی سطح Note، طبق تصمیم ۰۰۱ در DECISIONS.md)
      for (const tagName of tagNames) {
        const tag = await tx.tag.upsert({
          where: { userId_name: { userId, name: tagName } },
          update: {},
          create: { userId, name: tagName },
        });
        await tx.noteTag.create({ data: { noteId: note.id, tagId: tag.id } });
      }

      // برای هر Template فعال این NoteType، یک Card در جعبه ۱ می‌سازیم
      const cards = [];
      for (const template of noteType.templates) {
        const card = await tx.card.create({
          data: {
            noteId: note.id,
            templateId: template.id,
            deckId,
            userId,
            currentBox: 1,
            status: "active",
            nextReviewAt: new Date(), // همین امروز آماده مرور است
          },
        });
        cards.push(card);
      }

      await tx.deck.update({
        where: { id: deckId },
        data: { cardCountCache: { increment: cards.length } },
      });

      return { note, cards };
    });
  }

  /** میان‌بر برای واژه ساده (basic_word) — نگه‌داشته شده برای سازگاری با فاز ۲ اولیه */
  async createManualWord(input: CreateManualNoteInput) {
    const { userId, deckId, front, meaningFa, exampleEn, tagNames = [] } = input;
    return this.createNote({
      userId,
      deckId,
      noteTypeId: "basic_word",
      fieldValues: { front, meaning_fa: meaningFa, example_en: exampleEn ?? "" },
      tagNames,
    });
  }

  /**
   * ایمپورت دسته‌ای — طبق بخش ۲ سند معماری، محدودیت ۱۰۰ لغت هر بار.
   * چون هنوز BullMQ نداریم (طبق تصمیم ۰۰۳، فقط وقتی واقعاً لازم شد اضافه
   * می‌شه)، این synchronous اجرا می‌شه؛ برای ۱۰۰ ردیف کاملاً قابل قبوله.
   */
  async bulkImportBasicWords(
    userId: string,
    deckId: string,
    rows: { front: string; meaningFa: string; exampleEn?: string }[]
  ): Promise<{ imported: number; skipped: number }> {
    const MAX_ROWS = 100;
    if (rows.length > MAX_ROWS) {
      throw new Error(`حداکثر ${MAX_ROWS} لغت در هر ایمپورت مجاز است.`);
    }

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      if (!row.front?.trim() || !row.meaningFa?.trim()) {
        skipped++;
        continue;
      }
      await this.createManualWord({
        userId,
        deckId,
        front: row.front.trim(),
        meaningFa: row.meaningFa.trim(),
        exampleEn: row.exampleEn?.trim(),
      });
      imported++;
    }
    return { imported, skipped };
  }

  /** جستجو/فیلتر لغات یک کاربر — پایه Card Browser فاز ۳ */
  async listNotes(userId: string, opts?: { search?: string; tagName?: string; noteTypeId?: string }) {
    return this.prisma.note.findMany({
      where: {
        userId,
        ...(opts?.noteTypeId && { noteTypeId: opts.noteTypeId }),
        ...(opts?.search && {
          fieldValues: {
            path: ["front"],
            string_contains: opts.search,
          },
        }),
        ...(opts?.tagName && {
          tags: { some: { tag: { name: opts.tagName } } },
        }),
      },
      include: { cards: true, tags: { include: { tag: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /** همه لغاتی که یک تگ خاص دارند — دقیقاً همان قابلیت «شبکه‌ای» که در مصاحبه خواسته شد */
  async getNotesByTag(userId: string, tagName: string) {
    return this.listNotes(userId, { tagName });
  }

  /** کمکی داخلی: Note رو برمی‌گردونه، فقط اگه واقعاً مال همین کاربر باشه */
  private async getOwnedNote(userId: string, noteId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({ where: { id: noteId } });
    if (note.userId !== userId) throw new Error("این لغت متعلق به این کاربر نیست.");
    return note;
  }

  /**
   * ویرایش فیلدهای یک Note (مثلاً متن جمله کاربردی یا تعریف انگلیسی‌اش).
   * چون fieldValues یک JSON آزاده، فقط Merge می‌کنیم، نه جایگزینی کامل —
   * تا فیلدهایی که تو همین درخواست نیومدن پاک نشن.
   */
  async updateNoteFields(userId: string, noteId: string, fieldValues: Record<string, unknown>) {
    const note = await this.getOwnedNote(userId, noteId);
    const merged = { ...(note.fieldValues as Record<string, unknown>), ...fieldValues };
    return this.prisma.note.update({ where: { id: noteId }, data: { fieldValues: merged } });
  }

  /** افزودن یک مثال جدید به فیلد آرایه‌ای examples یک Note (بدون پاک‌کردن مثال‌های قبلی) */
  async addExample(userId: string, noteId: string, example: string) {
    const note = await this.getOwnedNote(userId, noteId);
    const current = note.fieldValues as Record<string, unknown>;
    const examples = Array.isArray(current.examples) ? current.examples : [];
    return this.prisma.note.update({
      where: { id: noteId },
      data: { fieldValues: { ...current, examples: [...examples, example] } },
    });
  }

  /** افزودن یک تگ به Note (Upsert روی Tag، طبق همون الگوی createNote) */
  async addTag(userId: string, noteId: string, tagName: string) {
    await this.getOwnedNote(userId, noteId); // فقط برای چک مالکیت
    const tag = await this.prisma.tag.upsert({
      where: { userId_name: { userId, name: tagName } },
      update: {},
      create: { userId, name: tagName },
    });
    await this.prisma.noteTag.upsert({
      where: { noteId_tagId: { noteId, tagId: tag.id } },
      update: {},
      create: { noteId, tagId: tag.id },
    });
  }

  /** حذف کامل یک Note (و به‌تبع Cascade، هر Card ای که ازش ساخته شده) */
  async deleteNote(userId: string, noteId: string) {
    await this.getOwnedNote(userId, noteId);
    await this.prisma.note.delete({ where: { id: noteId } });
  }

  /**
   * 🔑 «تبدیل به فلش‌کارت» — طبق DECISIONS.md ورودی ۰۱۲. Note هایی مثل
   * useful_sentence با Template غیرفعال ساخته می‌شن (نگاه کن به seed.ts)،
   * پس createNote عادی هیچ Card ای براشون نمی‌سازه. این متد مستقیم از
   * روی همون Template(های) NoteType (فعال یا نه) Card واقعی می‌سازه —
   * دقیقاً همون لحظه‌ای که کاربر صریحاً تصمیم می‌گیره.
   */
  async promoteNoteToCard(userId: string, noteId: string, deckId: string) {
    const note = await this.getOwnedNote(userId, noteId);
    const noteType = await this.prisma.noteType.findUniqueOrThrow({
      where: { id: note.noteTypeId },
      include: { templates: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const cards = [];
      for (const template of noteType.templates) {
        const existing = await tx.card.findUnique({
          where: { noteId_templateId: { noteId, templateId: template.id } },
        });
        if (existing) continue; // از قبل کارت ساخته — دوباره نساز
        const card = await tx.card.create({
          data: {
            noteId,
            templateId: template.id,
            deckId,
            userId,
            currentBox: 1,
            status: "active",
            nextReviewAt: new Date(),
          },
        });
        cards.push(card);
      }
      if (cards.length > 0) {
        await tx.deck.update({
          where: { id: deckId },
          data: { cardCountCache: { increment: cards.length } },
        });
      }
      return { cards };
    });
  }
}
