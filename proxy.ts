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

export default clerkMiddleware(async (auth, req) => {
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
