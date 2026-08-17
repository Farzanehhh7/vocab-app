import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * کاربر داخلی (جدول users خودمان) را از روی Session فعلی Clerk برمی‌گرداند.
 * اگر کاربر با این clerkId هنوز در دیتابیس ما نبود (مثلاً وب‌هوک هنوز
 * نرسیده بود)، این تابع به‌عنوان fallback خودش می‌سازدش تا هیچ درخواستی
 * fail نشود.
 *
 * 🔑 با React.cache() پیچیده شده: بدون این، چون خیلی جاها (layout برای
 * StreakBadge، هر Page، هر Route Handler) این تابع رو صدا می‌زنن، هر بار
 * یه Query جدید به دیتابیس می‌زد — رو Neon (که هر Query می‌تونه Latency
 * قابل‌توجه داشته باشه) این یعنی همون صفحه چندبار همون Query یکسان رو
 * تکرار می‌کرد. cache() تضمین می‌کنه در یک Request/Render، فقط یه‌بار
 * واقعاً به دیتابیس بزنه؛ صداهای بعدی همون نتیجه Cache‌شده رو برمی‌گردونن.
 */
export const getCurrentUser = cache(async () => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    // Fallback — معمولاً کاربر باید توسط Webhook (app/api/webhooks/clerk)
    // از قبل ساخته شده باشد؛ این حالت فقط برای اطمینان است.
    const clerkUser = await (await import("@clerk/nextjs/server")).clerkClient();
    const details = await clerkUser.users.getUser(clerkId);
    user = await prisma.user.create({
      data: {
        clerkId,
        email: details.emailAddresses[0]?.emailAddress ?? `${clerkId}@unknown.local`,
        username: details.username ?? undefined,
      },
    });
  }

  return user;
});
