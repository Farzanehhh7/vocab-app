/**
 * در Next.js 16، Middleware به Proxy تغییر نام داد؛ منطق clerkMiddleware()
 * همان است، فقط اسم فایل عوض شده (proxy.ts به‌جای middleware.ts).
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)", // وب‌هوک‌ها (مثل ثبت‌نام کاربر جدید) باید عمومی بمانند
]);

// ⚠️ فقط برای تست محلی سریع‌تر (طبق DECISIONS.md ورودی ۰۱۴) — auth.protect()
// خودش یه Round-trip اضافه به Clerk می‌زنه که رو حالت Dev کند حس می‌شه.
// پیش‌فرض خاموشه (auth.protect() طبق معمول اجرا می‌شه)؛ فقط با گذاشتن
// DISABLE_AUTH_FOR_TESTING="true" تو .env محلی خودت (نه .env.example!)
// فعال می‌شه. هر Route هنوز جدا از طریق getCurrentUser() چک می‌کنه، پس
// این فقط لایه Middleware رو حذف می‌کنه، نه امنیت واقعی Route ها رو.
// قبل از Deploy واقعی، حتماً این متغیر رو از .env حذف/false کن.
const authDisabledForTesting = process.env.DISABLE_AUTH_FOR_TESTING === "true";

export default clerkMiddleware(async (auth, req) => {
  if (authDisabledForTesting) return;
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
    "/(api|trpc)(.*)",
  ],
};
