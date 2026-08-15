import type { PrismaClient } from "@prisma/client";

export class DecksService {
  constructor(private prisma: PrismaClient) {}

  async createDeck(userId: string, name: string, examContext = "ielts") {
    return this.prisma.deck.create({
      data: { userId, name, examContext },
    });
  }

  async listDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getDeck(userId: string, deckId: string) {
    return this.prisma.deck.findFirstOrThrow({
      where: { id: deckId, userId },
    });
  }

  async deleteDeck(userId: string, deckId: string) {
    // مطمئن می‌شویم دسته متعلق به همین کاربر است قبل از حذف
    await this.getDeck(userId, deckId);
    return this.prisma.deck.delete({ where: { id: deckId } });
  }

  /** ساخت دسته پیش‌فرض برای کاربر تازه‌ثبت‌نام‌کرده (فراخوانی از Webhook ثبت‌نام Clerk) */
  async ensureDefaultDeck(userId: string) {
    const existing = await this.prisma.deck.findFirst({
      where: { userId, isDefault: true },
    });
    if (existing) return existing;

    return this.prisma.deck.create({
      data: { userId, name: "لغات من", isDefault: true, examContext: "ielts" },
    });
  }
}
