import type { PrismaClient } from "@prisma/client";

/**
 * ماژول Tags — پیاده‌سازی مستقیم بینش ۰۰۱ در DECISIONS.md:
 * «تگ‌ها باید به‌عنوان موجودیت مستقل و قابل کوئری، مستقل از Deck/جعبه،
 * ذخیره بشن تا بشه لغات رو به‌صورت شبکه‌ای مرور کرد.»
 *
 * این ماژول عمداً جدا از notes-cards نگه داشته شده (نه ادغام باهاش)
 * چون تگ یک مفهوم Cross-Cutting است که قراره در آینده از ماژول‌های
 * دیگه (مثلاً Writing) هم استفاده بشه — طبق قانون ۱ نقشه راه.
 */
export interface TagWithCount {
  id: string;
  name: string;
  noteCount: number;
}

export interface TaggedNote {
  noteId: string;
  fieldValues: Record<string, unknown>;
  tags: string[];
  cards: {
    cardId: string;
    deckName: string;
    currentBox: number;
    status: string;
  }[];
}

export class TagsService {
  constructor(private prisma: PrismaClient) {}

  /** همه تگ‌های کاربر به‌همراه تعداد لغاتی که هرکدوم دارن */
  async listTagsWithCounts(userId: string): Promise<TagWithCount[]> {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { notes: true } } },
      orderBy: { name: "asc" },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      noteCount: tag._count.notes,
    }));
  }

  /**
   * تمام لغاتی که یک تگ خاص دارند — همراه با وضعیت فعلی‌شون در جعبه‌های لایتنر.
   * این دقیقاً همون قابلیتیه که در آینده می‌تونه پایه‌ی «همه کالوکیشن‌های
   * تگ environment رو برای رایتینگ بیار» بشه.
   */
  async getNotesByTag(userId: string, tagName: string): Promise<TaggedNote[]> {
    const tag = await this.prisma.tag.findUnique({
      where: { userId_name: { userId, name: tagName } },
    });
    if (!tag) return [];

    const noteTags = await this.prisma.noteTag.findMany({
      where: { tagId: tag.id },
      include: {
        note: {
          include: {
            cards: { include: { deck: true } },
            tags: { include: { tag: true } },
          },
        },
      },
    });

    return noteTags.map((nt) => ({
      noteId: nt.note.id,
      fieldValues: nt.note.fieldValues as Record<string, unknown>,
      tags: nt.note.tags.map((t) => t.tag.name),
      cards: nt.note.cards.map((c) => ({
        cardId: c.id,
        deckName: c.deck.name,
        currentBox: c.currentBox,
        status: c.status,
      })),
    }));
  }

  /**
   * مثل getNotesByTag، ولی برای چند تگ هم‌زمان (منطق OR: لغتی که حداقل
   * یکی از تگ‌های انتخابی رو داشته باشه). این دقیقاً همون قابلیتیه که
   * کامنت بالای getNotesByTag پیش‌بینی کرده بود: «همه کالوکیشن‌های تگ
   * environment رو برای رایتینگ بیار» — حالا برای چند تگ با هم.
   */
  async getNotesByTags(userId: string, tagNames: string[]): Promise<TaggedNote[]> {
    if (tagNames.length === 0) return [];

    const noteTags = await this.prisma.noteTag.findMany({
      where: { tag: { userId, name: { in: tagNames } } },
      include: {
        note: {
          include: {
            cards: { include: { deck: true } },
            tags: { include: { tag: true } },
          },
        },
      },
    });

    const seen = new Map<string, TaggedNote>();
    for (const nt of noteTags) {
      if (seen.has(nt.note.id)) continue;
      seen.set(nt.note.id, {
        noteId: nt.note.id,
        fieldValues: nt.note.fieldValues as Record<string, unknown>,
        tags: nt.note.tags.map((t) => t.tag.name),
        cards: nt.note.cards.map((c) => ({
          cardId: c.id,
          deckName: c.deck.name,
          currentBox: c.currentBox,
          status: c.status,
        })),
      });
    }
    return [...seen.values()];
  }
}
