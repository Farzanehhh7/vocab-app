import type { PrismaClient } from "@prisma/client";

export class LibraryService {
  constructor(private prisma: PrismaClient) {}

  /** لیست منابع + عنوان درس‌هاشون — برای صفحه اصلی کتابخانه */
  async listSources() {
    return this.prisma.source.findMany({
      include: {
        lessons: {
          select: { id: true, title: true, unitCode: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * جزئیات کامل یک درس برای صفحه خواندن: محتوا + لغات رسمی (مشترک) +
   * Highlight های *همین کاربر* (شخصیه، نه بقیه کاربرا).
   */
  async getLessonDetail(lessonId: string, userId: string) {
    return this.prisma.lesson.findUniqueOrThrow({
      where: { id: lessonId },
      include: {
        source: { select: { id: true, title: true } },
        vocabItems: { orderBy: { orderIndex: "asc" } },
        highlights: { where: { userId } },
      },
    });
  }

  /** افزودن یک Highlight شخصی — فقط یه بازه (blockIndex + آفست) ذخیره می‌شه */
  async addHighlight(
    userId: string,
    lessonId: string,
    input: { blockIndex: number; startOffset: number; endOffset: number; style: string }
  ) {
    if (input.startOffset >= input.endOffset) {
      throw new Error("بازه انتخاب‌شده نامعتبر است.");
    }
    return this.prisma.highlight.create({
      data: {
        userId,
        lessonId,
        blockIndex: input.blockIndex,
        startOffset: input.startOffset,
        endOffset: input.endOffset,
        style: input.style,
      },
    });
  }

  /** حذف یک Highlight — فقط اگه واقعاً مال همین کاربر باشه */
  async removeHighlight(userId: string, highlightId: string) {
    const highlight = await this.prisma.highlight.findUniqueOrThrow({ where: { id: highlightId } });
    if (highlight.userId !== userId) {
      throw new Error("این Highlight متعلق به این کاربر نیست.");
    }
    await this.prisma.highlight.delete({ where: { id: highlightId } });
  }

  /** لیست دسته‌بندی‌های موضوعی («گلچین لغات پرکاربرد») + تعداد لغت هرکدوم */
  async listCategories() {
    const categories = await this.prisma.category.findMany({
      include: { _count: { select: { vocabItems: true } } },
      orderBy: { name: "asc" },
    });
    return categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, vocabCount: c._count.vocabItems }));
  }

  /** همه لغات یک دسته‌بندی، از هر درس/کتابی که باشن (Cross-Lesson) */
  async getCategoryDetail(slug: string) {
    const category = await this.prisma.category.findUniqueOrThrow({
      where: { slug },
      include: {
        vocabItems: {
          include: { lessonVocab: { include: { lesson: { select: { id: true, title: true } } } } },
        },
      },
    });
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      vocabItems: category.vocabItems.map((vc) => ({
        id: vc.lessonVocab.id,
        term: vc.lessonVocab.term,
        meaningFa: vc.lessonVocab.meaningFa,
        exampleEn: vc.lessonVocab.exampleEn,
        lessonId: vc.lessonVocab.lesson.id,
        lessonTitle: vc.lessonVocab.lesson.title,
      })),
    };
  }

  /** لغات چند دسته‌بندی هم‌زمان (منطق OR) — پایه دستیار رایتینگ */
  async getVocabByCategories(categorySlugs: string[]) {
    if (categorySlugs.length === 0) return [];
    const links = await this.prisma.lessonVocabCategory.findMany({
      where: { category: { slug: { in: categorySlugs } } },
      include: { lessonVocab: { include: { lesson: { select: { id: true, title: true } } } } },
    });
    const seen = new Map<string, ReturnType<typeof this.mapVocabLink>>();
    for (const link of links) {
      if (seen.has(link.lessonVocab.id)) continue;
      seen.set(link.lessonVocab.id, this.mapVocabLink(link));
    }
    return [...seen.values()];
  }

  private mapVocabLink(link: {
    lessonVocab: { id: string; term: string; meaningFa: string; exampleEn: string | null; lesson: { id: string; title: string } };
  }) {
    return {
      id: link.lessonVocab.id,
      term: link.lessonVocab.term,
      meaningFa: link.lessonVocab.meaningFa,
      exampleEn: link.lessonVocab.exampleEn,
      lessonId: link.lessonVocab.lesson.id,
      lessonTitle: link.lessonVocab.lesson.title,
    };
  }
}
