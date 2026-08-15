# جعبه لایتنر — MVP (فاز ۱-۲)

اسکلت اولیه پروژه، ساخته‌شده طبق `docs/architecture.md` و `docs/solo-founder-roadmap.md`.
تصمیمات مهم معماری در `DECISIONS.md` ثبت می‌شوند — قبل از تغییرات بزرگ حتماً بخوانش.
برای وضعیت لحظه‌ای پروژه (چی کار می‌کنه، چی ناقصه، قدم بعدی چیه)، `PROJECT_STATUS.md`
رو ببین. اگه از یک دستیار AI (Claude Code یا مشابه) کمک می‌گیری، `AGENTS.md` قوانین
پروژه رو براش خلاصه کرده.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma** + **PostgreSQL** (پیشنهاد میزبانی: [Neon](https://neon.tech))
- **Clerk** برای احراز هویت
- **Vitest** برای تست واحد

## ساختار پروژه

```
app/
  api/v1/...          ← Route Handler های نسخه‌بندی‌شده (طبق قانون ۴ نقشه راه)
  api/webhooks/clerk/  ← همگام‌سازی کاربر جدید Clerk با دیتابیس ما
  layout.tsx, page.tsx
lib/
  modules/
    leitner/          ← 🔑 هسته الگوریتم مرور (service.ts + service.test.ts)
    decks/            ← CRUD دسته‌های لایتنر
    notes-cards/       ← ساخت Note/Card + موتور رندر Template
    users/             ← اتصال کاربر Clerk به کاربر داخلی
  prisma.ts            ← Prisma Client singleton
  utils/
prisma/
  schema.prisma         ← مدل کامل Note/Card/Deck/Tag (بخش ۴.۳ سند معماری)
  seed.ts               ← Seed اولیه: Note Type ها + بازه‌های جعبه
docs/
  architecture.md        ← سند معماری کامل (نسخه ۲.۰)
  solo-founder-roadmap.md
```

## راه‌اندازی محلی (Local Setup)

### ۱. نصب وابستگی‌ها
```bash
npm install
```

### ۲. متغیرهای محیطی
```bash
cp .env.example .env.local
```
مقادیر واقعی رو از حساب‌هایی که در گام ۰.۴ نقشه راه ساختی پر کن:
- `DATABASE_URL` از داشبورد Neon
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` و `CLERK_SECRET_KEY` از داشبورد Clerk
- `CLERK_WEBHOOK_SIGNING_SECRET` بعد از تنظیم Webhook (مرحله ۵)

### ۳. دیتابیس
```bash
npm run db:generate    # تولید Prisma Client
npm run db:migrate     # اجرای Migration (شامل فیلد جدید preferAdvancedGrading)
npm run db:seed        # پر کردن Note Type های پیش‌فرض
```
> اگه قبلاً یک‌بار Migrate کرده بودی، همین دستور `db:migrate` رو دوباره اجرا کن —
> Prisma فقط تغییرات جدید (مثل ستون `preferAdvancedGrading`) رو اعمال می‌کنه.

> اگه این مرحله رو تو یک محیط با دسترسی محدود اینترنت اجرا می‌کنی (نه لپ‌تاپ خودت)،
> ممکنه دانلود Prisma Engine fail بشه. روی لپ‌تاپ شخصی این مشکلی نداره.

### ۴. اجرای پروژه
```bash
npm run dev
```
باز کن: http://localhost:3000

### ۵. تنظیم Webhook کاربر (بعد از اولین Deploy روی Vercel)
داشبورد Clerk → Webhooks → Add Endpoint:
- Endpoint URL: `https://<دامنه‌ات>.vercel.app/api/webhooks/clerk`
- Event: `user.created`
- Signing Secret رو کپی کن و در `CLERK_WEBHOOK_SIGNING_SECRET` بذار

### ۶. تست واحد الگوریتم لایتنر
```bash
npm run test
```
این تست‌ها روی منطق `calculateNextBox` هستن — طبق قانون ۵ نقشه راه، همیشه باید سبز بمونن.

## صفحات UI آماده (فاز ۲ — نسخه پیشرفته)

| مسیر | توضیح |
|---|---|
| `/` | صفحه اصلی — لینک به داشبورد بعد از ورود |
| `/leitner` | نقطه ورود — به داشبورد دسته پیش‌فرض هدایت می‌کند |
| `/leitner/:deckId` | داشبورد ۵ جعبه یک دسته + جابه‌جایی بین دسته‌ها + ساخت دسته جدید |
| `/leitner/:deckId/review` | مرور فلش‌کارت — Flip سه‌بعدی، تلفظ صوتی 🔊، حالت ساده/پیشرفته (۲ یا ۴ دکمه)، Undo |
| `/leitner/tags` | 🆕 شبکه لغات — لیست همه تگ‌ها با تعداد لغت هرکدام |
| `/leitner/tags/:tagName` | 🆕 همه لغات یک تگ، همراه وضعیت فعلی‌شون در هر دسته/جعبه |
| `/leitner/browse` | 🆕 Card Browser — جستجو + فیلتر (دسته/جعبه/وضعیت/پرچم) + Suspend/Flag |

### قابلیت‌های پیشرفته این تکرار

- **حالت مرور پیشرفته (۴ دکمه Again/Hard/Good/Easy)**: از داخل صفحه مرور با دکمه
  «حالت پیشرفته» فعال/غیرفعال می‌شه؛ ترجیح کاربر تو `User.preferAdvancedGrading`
  ذخیره می‌مونه. بک‌اند الگوریتم (`calculateNextBox`) از همون فاز ۲ اولیه این ۴ حالت
  رو پشتیبانی می‌کرد؛ این‌بار فقط UI و تنظیمات کاربر بهش وصل شد.
- **تلفظ صوتی**: دکمه 🔊 روی فلش‌کارت با Web Speech API مرورگر (رایگان، بدون نیاز
  به فایل صوتی از قبل) — طبق تصمیم اولیه نقشه راه برای این فاز.
- **شبکه لغات بر اساس تگ**: مستقیم پیاده‌سازی بینش ۰۰۱ در `DECISIONS.md` — لغات از
  دیدگاه تگ (نه فقط دسته/جعبه) قابل مرورن، پایه‌ی آماده برای ماژول‌های آینده (مثل
  Writing) که بخوان از این «شبکه» تغذیه کنن.
- **چند Deck واقعی**: امکان ساخت دسته‌های جدید و جابه‌جایی بینشون از بالای داشبورد.

### 🆕 مدل جدید فلش‌کارت: «واژه با چند مثال» (ضدحفظ‌کردن)

به‌جای یک مثال ثابت، این Note Type چند مثال ذخیره می‌کند و **هر بار مرور،
یک زیرمجموعه تصادفی (پیش‌فرض ۲ مورد) نشون می‌ده** — طبق اصل «تمرین بازیابی
در بافت‌های متنوع» که در DECISIONS.md ورودی ۰۰۸ توضیح داده شده. هدف: جلوگیری
از این‌که کاربر یک جمله ثابت رو حفظ کنه به‌جای یادگیری واقعی خود کلمه.

- دکمه «+ افزودن با چند مثال» کنار دکمه ساده در داشبورد
- دکمه «✨ پیشنهاد از AI» — با Claude API چند مثال متنوع (بافت/ساختار گرامری
  متفاوت) پیشنهاد می‌ده؛ نیاز به `ANTHROPIC_API_KEY` در `.env.local` دارد
- هیچ Migration دیتابیسی برای این فیچر لازم نبود — دقیقاً همون مزیت مدل
  Note/Card که در سند معماری (بخش ۱۲) طراحی شده بود

## سیستم طراحی

- فونت: **Vazirmatn** (فونت فارسی باکیفیت، از `next/font/google`)
- پالت رنگ هدفمند (نه تزئینی) در `app/globals.css`:
  - `--brand` (فیروزه‌ای تیره): تمرکز و آرامش
  - `--accent` (کهربایی): نشان Streak
  - `--box-1` تا `--box-5`: گرادیان قرمز→فیروزه‌ای برای ۵ جعبه، معنادار (قرمز = نیاز فوری، فیروزه‌ای = نزدیک یادگیری کامل)
- کلاس‌های سفارشی Tailwind v4 از طریق `@theme inline` تعریف شدن — یعنی `bg-brand`, `text-box-1` و غیره مستقیم قابل استفاده‌ن

## API های آماده (فاز ۱-۲)

| Method | مسیر | توضیح |
|---|---|---|
| GET | `/api/v1/me` | اطلاعات کاربر جاری + Streak + ترجیح حالت مرور |
| PATCH | `/api/v1/me` | آپدیت `preferAdvancedGrading` |
| GET | `/api/v1/decks` | لیست دسته‌های کاربر |
| POST | `/api/v1/decks` | ساخت دسته جدید |
| GET | `/api/v1/decks/:deckId/box-summary` | تعداد لغت هر جعبه |
| POST | `/api/v1/decks/:deckId/words` | افزودن دستی لغت ساده (basic_word) |
| POST | `/api/v1/decks/:deckId/words/import` | 🆕 ایمپورت دسته‌ای از TXT/CSV (حداکثر ۱۰۰ ردیف) |
| POST | `/api/v1/decks/:deckId/notes` | 🆕 ساخت Note عمومی با هر Note Type (مثلاً word_with_examples) |
| POST | `/api/v1/ai/suggest-examples` | 🆕 پیشنهاد چند مثال متنوع با AI برای یک کلمه |
| GET | `/api/v1/decks/:deckId/review-queue` | صف مرور امروز (شامل HTML رندرشده + متن خام برای تلفظ) |
| POST | `/api/v1/cards/:cardId/review` | ثبت نتیجه مرور — `{ result }` (ساده) یا `{ grade }` (پیشرفته) |
| POST | `/api/v1/cards/:cardId/undo` | برگرداندن آخرین مرور |
| POST | `/api/v1/cards/:cardId/suspend` | 🆕 تعلیق/فعال‌سازی کارت |
| POST | `/api/v1/cards/:cardId/flag` | 🆕 پرچم‌گذاری/برداشتن پرچم |
| GET | `/api/v1/cards/browse` | 🆕 جستجو/فیلتر کارت‌ها (`?search=&deckId=&box=&status=&flaggedOnly=`) |
| GET | `/api/v1/tags` | 🆕 لیست تگ‌های کاربر با تعداد لغت |
| GET | `/api/v1/tags/:tagName/notes` | 🆕 همه لغات یک تگ با وضعیت فعلی‌شون |

## وضعیت فعلی و قدم بعدی

فاز ۲ و ۳ کامل شدن. برای دیدن دقیق «الان کجاییم» و «قدم بعدی چیه»،
`PROJECT_STATUS.md` رو نگاه کن — اون فایل به‌روزتر از این بخش README نگه
داشته می‌شه. برای تاریخچه تصمیمات و چرایی‌شون، `DECISIONS.md` رو ببین.
اگه با AI Pair-Programming (Claude Code یا مشابه) کار می‌کنی، `AGENTS.md`
رو هم بذار بخونه — قوانین این پروژه رو خلاصه کرده.
