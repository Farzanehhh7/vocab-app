<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-conventions -->
# قوانین این پروژه — قبل از هر تغییری این‌ها رو بخون

این بخش رو هر مدل/دستیار AI که این ریپو رو باز می‌کنه باید اول بخونه.
سند کامل معماری در `docs/architecture.md` و نقشه راه در `docs/solo-founder-roadmap.md` است؛
اینجا فقط خلاصه قوانین عملیاتیه.

## قبل از شروع هر Session کاری
1. `DECISIONS.md` رو بخون — خصوصاً چند ورودی آخر، تا بفهمی آخرین تصمیمات چی بودن و چرا.
2. `PROJECT_STATUS.md` رو بخون — می‌گه دقیقاً الان چی کار می‌کنه، چی نصفه‌کاره‌ست، قدم بعدی چیه.
3. `npm run test` بزن تا مطمئن شی از جایی که ول کردیم، همه‌چیز هنوز سالمه.

## مرزهای ماژول (هرگز نقض نکن)
- هر دامنه (`leitner`, `decks`, `notes-cards`, `tags`, `users`, `ai`) پوشه مستقل خودش رو
  در `lib/modules/` داره. هرگز مستقیم از دیتابیس یک ماژول در ماژول دیگه Query نزن —
  همیشه از طریق کلاس Service اون ماژول.
- منطق دامنه همیشه در `lib/modules/*/service.ts` می‌ره، نه داخل Route Handler
  (`app/api/...`) و نه داخل کامپوننت React. Route Handler فقط باید: احراز هویت چک کنه،
  ورودی رو Validate کنه، Service رو صدا بزنه، خروجی رو برگردونه.

## قبل از افزودن هر فیچر جدید
اول بپرس: «آیا این یک Note Type جدید هست (نیاز به Migration نداره، فقط Seed)،
یا واقعاً یک ماژول کاملاً جدیده؟» اکثر فیچرهای محتوایی جدید (نوع فلش‌کارت جدید)
با گزینه اول حل می‌شن — به `prisma/seed.ts` نگاه کن، الگوی `word_with_examples`
رو ببین.

## بعد از هر تغییر مهم
1. `npm run test`, `npx eslint .`, `npx tsc --noEmit` رو اجرا کن — باید تمیز باشن
   (فقط اگه `.env.local` واقعی نداری، خطاهای مربوط به `@prisma/client`
   طبیعیه؛ بعد از `npm run db:generate` محلی برطرف می‌شن).
2. یک ورودی جدید در `DECISIONS.md` اضافه کن (تاریخ، تصمیم، دلیل) — طبق قالب
   انتهای همون فایل.
3. `PROJECT_STATUS.md` رو با وضعیت جدید به‌روز کن.
4. اگر منطق حساس (الگوریتم لایتنر، امنیت، محاسبات) تغییر کرد، تست واحد
   بنویس یا آپدیت کن — نه صرفاً تست دستی.

## چیزهایی که عمداً هنوز نساختیم (به‌خاطر YAGNI، نه فراموشی)
این‌ها رو دوباره پیشنهاد نده مگر واقعاً لازم شد — در `docs/solo-founder-roadmap.md`
فازبندی شدن:
- Backend جدا (NestJS) — تصمیم ۰۰۳ در DECISIONS.md، عمدیه
- صف Async (BullMQ/Redis) — فقط وقتی حالت Bulk واقعی لازم شد اضافه می‌شه
- سیستم Quota کامل برای AI — فعلاً فقط محدودیت ساده روی تعداد مثال هر درخواست
<!-- END:project-conventions -->

