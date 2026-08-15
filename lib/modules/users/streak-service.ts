import type { PrismaClient } from "@prisma/client";
import { isSameDay, addDays } from "@/lib/utils/date";

/**
 * منطق Streak — طبق ورودی ۰۰۱ در DECISIONS.md، این مکانیزم در مصاحبه
 * کاربر به‌عنوان اصلی‌ترین دلیل مرور روزانه پیوسته تأیید شد؛ به همین
 * دلیل در فاز ۲ (نه فازهای بعدی) پیاده‌سازی شد.
 *
 * قانون: هر روز کاری که کاربر حداقل یک مرور انجام دهد، Streak حفظ/افزایش
 * می‌یابد. اگر یک روز کامل رد شود بدون فعالیت، Streak صفر می‌شود.
 */
export class StreakService {
  constructor(private prisma: PrismaClient) {}

  async recordActivity(userId: string): Promise<{ currentStreak: number; isNewDay: boolean }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const today = new Date();

    if (user.lastActivityDate && isSameDay(user.lastActivityDate, today)) {
      // امروز قبلاً فعالیت ثبت شده — تغییری لازم نیست
      return { currentStreak: user.currentStreak, isNewDay: false };
    }

    const yesterday = addDays(today, -1);
    const wasActiveYesterday =
      user.lastActivityDate && isSameDay(user.lastActivityDate, yesterday);

    const newStreak = wasActiveYesterday ? user.currentStreak + 1 : 1;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, user.longestStreak),
        lastActivityDate: today,
      },
    });

    return { currentStreak: updated.currentStreak, isNewDay: true };
  }
}
