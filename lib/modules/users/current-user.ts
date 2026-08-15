import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * کاربر داخلی (جدول users خودمان) را از روی Session فعلی Clerk برمی‌گرداند.
 * اگر کاربر با این clerkId هنوز در دیتابیس ما نبود (مثلاً وب‌هوک هنوز
 * نرسیده بود)، این تابع به‌عنوان fallback خودش می‌سازدش تا هیچ درخواستی
 * fail نشود.
 */
export async function getCurrentUser() {
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
}
