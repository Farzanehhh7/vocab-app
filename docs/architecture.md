# معماری کامل پلتفرم آموزش لغت با سیستم جعبه لایتنر
### (Testinno Clone — Vocabulary Learning Platform Architecture)

**نسخه سند:** ۲.۰ — به‌روزشده با مدل Note/Card سبک Anki + موتور تولید کارت با AI
**هدف:** طراحی معماری قابل‌ارتقا، مقیاس‌پذیر و آماده تولید (Production-Ready) برای پلتفرمی که با ماژول لایتنر شروع می‌شود و در آینده به کتابخانه محتوا، آزمون‌ها، آمار و چند آزمون بین‌المللی (IELTS/TOEFL/GRE) گسترش می‌یابد.

> **تغییرات نسخه ۲.۰:** بخش لایتنر از مدل ساده «یک لغت = یک کارت» به مدل حرفه‌ای **Note/Card/Template** سبک Anki تغییر کرد؛ به‌همراه یک موتور تولید محتوای فلش‌کارت با AI (شامل تصمیم‌گیری خودکار نوع کارت، پر کردن فیلدها، و پیشنهاد تصویر مرتبط). بخش‌های ۴.۳، ۵، ۶ و ۱۱ به‌طور کامل بازنویسی و بخش‌های ۱۲ و ۱۳ اضافه شدند.

---

## فهرست مطالب

1. فلسفه و اصول طراحی
2. Tech Stack پیشنهادی
3. معماری کلی سیستم (High-Level Architecture)
4. مدل دیتابیس کامل (ERD)
5. الگوریتم Spaced Repetition (موتور لایتنر)
6. طراحی API
7. ساختار پوشه‌بندی پروژه
8. نقشه کامل صفحات (Site Map)
9. امنیت
10. مقیاس‌پذیری و Performance
11. نقشه راه توسعه (Roadmap فازبندی‌شده)
12. سیستم Note/Card سبک Anki — طراحی عمیق
13. موتور تولید کارت با هوش مصنوعی (AI Card Generation Engine)

---

## ۱. فلسفه و اصول طراحی

قبل از هر خط کد، چند اصل معماری رو مشخص می‌کنیم که تمام تصمیمات بعدی بر اساس اون‌ها گرفته می‌شه:

| اصل | توضیح |
|---|---|
| **Multi-Exam از روز اول** | چون سایت اصلی سه بخش GRE/TOEFL/IELTS داره، نباید IELTS رو hardcode کنیم. هر موجودیت (deck, word, exam) باید یک فیلد `exam_context` داشته باشه تا بشه بدون تغییر شِما، GRE و TOEFL رو اضافه کرد. |
| **Modular Monolith، نه Microservice زودهنگام** | با تیم کوچک شروع می‌کنیم. کد رو ماژولار می‌نویسیم (هر دامنه = یک Module مستقل با مرز مشخص) طوری که در آینده هرکدوم به‌راحتی به یک سرویس مستقل تبدیل بشه. |
| **جداسازی محتوا از پیشرفت (Content vs. Progress)** | لغت (Note) یک موجودیت سراسری/قابل‌اشتراک است. پیشرفت هر کاربر روی آن (جعبه، وضعیت یادگیری) در جدول جداگانه (Card) ذخیره می‌شود. |
| **جداسازی محتوای خام از نحوه نمایش (Note vs. Card)** 🆕 | دقیقاً همان اصل بنیادین Anki: محتوا (Note) یک‌بار ساخته می‌شود، اما می‌تواند از طریق چند Template به چند کارت قابل‌مرور مستقل تبدیل شود. این جداسازی، پایه‌ی تصمیم‌گیری هوشمند AI برای نوع کارت است. |
| **Event-Driven برای آمار** | هر عمل کاربر یک Event/Log تولید می‌کند. صفحه Charts چیزی جز Aggregation روی این لاگ‌ها نیست. |
| **API-First** | فرانت‌اند (وب و احتمالاً اپ موبایل در آینده) از یک API واحد تغذیه می‌شوند. |
| **Human-in-the-loop برای AI** 🆕 | هیچ محتوای تولیدشده با AI مستقیماً وارد دیتابیس اصلی نمی‌شود؛ همیشه یک مرحله تأیید/ویرایش کاربر وجود دارد. |
| **Offline-Friendly Review Queue** | مرور فلش‌کارت باید قابلیت کارکرد نیمه‌آفلاین داشته باشد (کش لوکال + همگام‌سازی). |

---

## ۲. Tech Stack پیشنهادی

### Frontend
| لایه | تکنولوژی | دلیل انتخاب |
|---|---|---|
| فریم‌ورک | **Next.js 14+ (App Router)** | همون چیزی که در سایت مرجع هم دیدیم (chunks در DevTools تأیید کرد). SSR برای SEO صفحات کتابخانه، CSR برای بخش‌های تعاملی مثل فلش‌کارت. |
| زبان | **TypeScript** | Type-safety حیاتی است وقتی مدل داده (Note, Card, Template) پیچیده می‌شود. |
| استایل | **Tailwind CSS** + توکن‌های سفارشی (`bg-surface-*`) | دقیقاً الگویی که در سایت مرجع دیدیم. |
| مدیریت State سرور | **TanStack Query (React Query)** | کش، Optimistic Update برای دکمه‌های مرور (باید فوری واکنش نشان دهد، بعد Sync با سرور). |
| مدیریت State کلاینت | **Zustand** | برای UI state ساده (مودال‌ها، فیلترها) |
| فرم‌ها | **React Hook Form + Zod** | اعتبارسنجی type-safe، مخصوصاً برای فرم‌های داینامیک ساخت Note (فیلدها بسته به Note Type متفاوت‌اند) |
| PWA | **next-pwa** | برای قابلیت آفلاین مرور لایتنر |
| چارت‌ها | **Recharts / ECharts** | برای نمودارهای خطی، Gauge، Heatmap |
| صوت | **Howler.js** | پخش تلفظ US/UK |

### Backend
| لایه | تکنولوژی | دلیل انتخاب |
|---|---|---|
| فریم‌ورک | **NestJS (Node.js + TypeScript)** | معماری ماژولار native، مهاجرت آسان به میکروسرویس در آینده |
| ORM | **Prisma** | Type-safe، Migration مدیریت‌شده، پشتیبانی خوب از JSONB (برای فیلدهای داینامیک Note) |
| دیتابیس اصلی | **PostgreSQL** | یکپارچگی رابطه‌ای قوی + JSONB برای فیلدهای منعطف Note + Full Text Search داخلی |
| کش | **Redis** | کش صف مرور روزانه، Session، Rate-limiting، Pub/Sub چت‌روم |
| صف پردازش | **BullMQ (روی Redis)** | ایمپورت فایل حجیم، **تولید دسته‌ای کارت با AI (بسیار حیاتی برای این بخش)**، محاسبه شبانه Streak |
| جستجوی پیشرفته | **Meilisearch یا Typesense** | جستجوی سریع در Note ها و کتابخانه (فاز ۲ به بعد) |
| فایل/رسانه | **S3-Compatible Storage + CDN** | کاور کتاب، فایل صوتی، **تصاویر فلش‌کارت (اعم از دانلودشده یا AI-generated)** |
| احراز هویت | **JWT (Access + Refresh) + Argon2** | |
| **تولید محتوا با AI** 🆕 | **Anthropic API (Claude) با Structured Outputs (JSON mode)** | برای تحلیل واژه/عبارت، تصمیم نوع کارت، و تولید فیلدها. پیشنهاد استفاده از یک مدل سریع/ارزان (مثل Haiku) برای طبقه‌بندی اولیه و یک مدل قوی‌تر (Sonnet) برای تولید محتوای نهایی با کیفیت. |
| **جستجوی تصویر** 🆕 | **Unsplash API / Pexels API** | برای کلمات عینی؛ رایگان و کیفیت واقعی بالا |
| **تولید تصویر (اختیاری)** 🆕 | یک سرویس تولید تصویر سبک illustration (برای مفاهیم انتزاعی/اصطلاحات) | فقط در صورت نیاز، چون هزینه‌بر است — کش‌شده و قابل‌استفاده مجدد |
| Realtime | **Socket.io** | چت‌روم |
| مانیتورینگ | **Sentry** + **Grafana/Prometheus** | |
| CI/CD | **GitHub Actions → Docker → VPS/Cloud** | |

---

## ۳. معماری کلی سیستم (High-Level Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         کلاینت‌ها                                  │
│   Web (Next.js PWA)   │   Mobile App (آینده)                     │
└───────────────┬─────────────────────────┬───────────────────────┘
                │ HTTPS/REST + WebSocket   │
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Nginx / Load Balancer            │
└───────────────────────────────┬───────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend Application (NestJS Monolith)           │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │
│  │   Auth    │ │   Users   │ │   Decks   │ │  Leitner Engine    │ │
│  │  Module   │ │  Module   │ │  Module   │ │  (Review/SRS)      │ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────────────┘ │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────────┐ │
│  │ Note/Card │ │ 🆕 AI     │ │  Library  │ │  Exams / Analytics │ │
│  │  Module   │ │ Generator │ │  Module   │ │  Modules           │ │
│  └───────────┘ └─────┬─────┘ └───────────┘ └───────────────────┘ │
│                       │                                            │
│  ┌───────────┐ ┌──────▼────┐                                     │
│  │Notification│ │  Media    │  (Modules مستقل، آماده جداسازی)      │
│  │  Module    │ │  Module   │                                     │
│  └───────────┘ └───────────┘                                     │
└──────┬──────────────┬───────────────┬──────────────┬─────┬───────┘
       ▼               ▼               ▼               ▼     ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ ┌─────────────┐
│ PostgreSQL │  │   Redis    │  │  BullMQ    │  │  Object  │ │ 🆕 External  │
│  (Primary) │  │  (Cache)   │  │  Workers   │  │  Storage │ │ AI/Image APIs│
│            │  │            │  │            │  │  + CDN   │ │(Claude,      │
│            │  │            │  │            │  │          │ │ Unsplash)    │
└────────────┘  └────────────┘  └────────────┘  └──────────┘ └─────────────┘
```

### ماژول‌های جدید نسخه ۲.۰
- **Note/Card Module**: مدیریت Note Type ها، Template ها، Note ها و Card های قابل‌مرور — جایگزین منطق ساده قبلی
- **AI Generator Module**: ارتباط با Claude API، تحلیل ورودی، تولید فیلدها، تصمیم نوع کارت، مدیریت صف تولید دسته‌ای
- **Media Module**: جستجو/دانلود/کش تصاویر از Unsplash/Pexels، مدیریت فایل‌های صوتی، آپلود کاربر

---

## ۴. مدل دیتابیس کامل (ERD)

> نکته: تمام کلیدهای اصلی از نوع `UUID` هستند.

### ۴.۱ کاربران و احراز هویت

```sql
users
├── id                  UUID (PK)
├── email               VARCHAR UNIQUE
├── username            VARCHAR UNIQUE
├── phone_number        VARCHAR NULLABLE
├── password_hash       VARCHAR
├── avatar_url          VARCHAR NULLABLE
├── is_premium          BOOLEAN DEFAULT false
├── premium_until       TIMESTAMP NULLABLE
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

user_streaks
├── user_id             UUID (PK, FK → users.id)
├── current_streak      INT DEFAULT 0
├── longest_streak      INT DEFAULT 0
├── last_activity_date  DATE
└── freeze_count        INT DEFAULT 0

refresh_tokens
├── id                  UUID (PK)
├── user_id             UUID (FK)
├── token_hash          VARCHAR
├── expires_at          TIMESTAMP
└── device_info         VARCHAR NULLABLE
```

### ۴.۲ هسته لغت (Master Dictionary — مشترک بین همه کاربران)

```sql
words                                             -- بانک مرکزی خودِ کلمه (بدون فرمت نمایش)
├── id                  UUID (PK)
├── text                VARCHAR INDEXED            -- "tend to", "hit the road", "aubergine"
├── language            VARCHAR DEFAULT 'en'
├── ipa_us              VARCHAR NULLABLE
├── ipa_uk              VARCHAR NULLABLE
├── audio_us_url        VARCHAR NULLABLE
├── audio_uk_url        VARCHAR NULLABLE
├── part_of_speech      VARCHAR NULLABLE
├── word_category       ENUM('single_word','collocation','phrasal_verb','idiom') NULLABLE 🆕
├── difficulty_level    VARCHAR NULLABLE
└── created_at          TIMESTAMP

CREATE INDEX idx_words_text_trgm ON words USING gin (text gin_trgm_ops);
```

> فیلد `word_category` در نسخه ۲.۰ اضافه شد چون این‌جا دقیقاً همان چیزی است که مرحله اول تحلیل AI مشخص می‌کند و برای انتخاب Note Type مناسب استفاده می‌شود (بخش ۱۳).

### ۴.۳ سیستم Note/Card سبک Anki 🆕 (جایگزین کامل مدل ساده قبلی)

> این بخش مهم‌ترین تغییر نسخه ۲.۰ است. توضیح مفهومی کامل آن در **بخش ۱۲** آمده؛ اینجا فقط شِمای دیتابیس را می‌بینید.

```sql
note_types                                        -- قالب محتوا: "واژه ساده"، "کالوکیشن"، "Cloze"، "اصطلاح تصویری"
├── id                  UUID (PK)
├── name                VARCHAR                    -- "Basic Word", "Collocation", "Idiom (Narrative)"
├── field_schema        JSONB                       -- تعریف فیلدها (نگاه کنید به بخش ۱۲.۲)
├── is_system           BOOLEAN DEFAULT true         -- پیش‌فرض سیستم یا ساخته کاربر
├── created_by          UUID (FK → users.id, NULLABLE)
└── created_at          TIMESTAMP

card_templates                                    -- نحوه رندر یک یا چند کارت از روی یک Note
├── id                  UUID (PK)
├── note_type_id        UUID (FK → note_types.id)
├── name                VARCHAR                    -- "Recognition (En→Fa)", "Production (Fa→En)", "Cloze"
├── front_template      TEXT                        -- قالب Handlebars-style: "{{front}}"
├── back_template       TEXT                        -- "{{meaning_fa}}<hr>{{example_en}}"
├── order_index         INT DEFAULT 0
└── is_active           BOOLEAN DEFAULT true

notes                                             -- محتوای خام (یک بار ساخته می‌شود)
├── id                  UUID (PK)
├── user_id             UUID (FK, NULLABLE)         -- NULL = Note عمومی/سیستمی قابل اشتراک
├── note_type_id        UUID (FK → note_types.id)
├── word_id             UUID (FK → words.id, NULLABLE)  -- ارتباط با دیکشنری مرکزی
├── field_values        JSONB                       -- {"front":"aubergine","meaning_fa":"بادمجان","image_url":"...","example_en":"..."}
├── source               ENUM('manual','ai_generated','book_import') 🆕
├── ai_generation_id     UUID (FK → ai_generations.id, NULLABLE) 🆕
└── created_at          TIMESTAMP

cards                                             -- 🔑 هر ردیف = یک کارت مستقل قابل‌مرور در جعبه لایتنر
├── id                  UUID (PK)
├── note_id             UUID (FK → notes.id)
├── template_id         UUID (FK → card_templates.id)
├── deck_id             UUID (FK → decks.id)
├── user_id             UUID (FK, denormalized)
├── current_box         INT DEFAULT 1
├── status              ENUM('active','learned','suspended') DEFAULT 'active'
├── is_flagged          BOOLEAN DEFAULT false
├── flag_color          VARCHAR NULLABLE            -- سبک Anki: red/orange/green/blue...
├── next_review_at      TIMESTAMP INDEXED
├── last_reviewed_at    TIMESTAMP NULLABLE
├── correct_streak      INT DEFAULT 0
├── total_reviews       INT DEFAULT 0
└── created_at          TIMESTAMP

CREATE UNIQUE INDEX idx_card_unique ON cards (note_id, template_id);   -- از هر Note+Template فقط یک کارت
CREATE INDEX idx_cards_review_queue ON cards (user_id, next_review_at) WHERE status = 'active';

decks                                             -- بدون تغییر نسبت به نسخه قبل
├── id                  UUID (PK)
├── user_id             UUID (FK → users.id, NULLABLE)
├── exam_context        ENUM('ielts','toefl','gre')
├── name                VARCHAR
├── is_public           BOOLEAN DEFAULT false
├── is_default          BOOLEAN DEFAULT false
├── cover_image_url     VARCHAR NULLABLE
├── card_count_cache    INT DEFAULT 0
└── created_at          TIMESTAMP

leitner_box_intervals
├── id                  UUID (PK)
├── deck_id             UUID (FK, NULLABLE)
├── box_number          INT (1-5)
├── interval_days       INT
└── icon_url            VARCHAR

review_logs                                       -- به‌روزشده: حالا به card اشاره می‌کند و grade چهارحالته دارد
├── id                  UUID (PK)
├── card_id             UUID (FK → cards.id) 🆕      -- به‌جای deck_word_id سابق
├── user_id             UUID (FK, denormalized)
├── grade               ENUM('again','hard','good','easy') 🆕  -- سیستم پیشرفته Anki-style
├── simple_result       ENUM('known','unknown') NULLABLE       -- برای حالت ساده (نگاشت‌شده از grade)
├── box_before          INT
├── box_after           INT
├── response_time_ms    INT NULLABLE
└── reviewed_at         TIMESTAMP INDEXED

color_tags
├── id, user_id, name, hex_color

note_tags                                         -- 🆕 تگ روی Note (نه Card) چون تگ محتوایی است
├── note_id             UUID (FK)
└── color_tag_id        UUID (FK)
```

> **چرا `grade` چهارحالته ولی `simple_result` هم نگه داشته شده؟**
> چون در بخش UI پیشنهاد دادیم حالت ساده (بلدم/بلدنیستم) پیش‌فرض بماند و حالت پیشرفته (Again/Hard/Good/Easy) اختیاری باشد. با نگاشت `known → good` و `unknown → again` در لایه سرویس، هر دو UI به یک مدل داده واحد می‌نویسند و آمار همیشه یکپارچه می‌ماند.

### ۴.۴ رسانه (تصویر/صوت) — جدول جدید 🆕

```sql
media_assets
├── id                  UUID (PK)
├── word_id             UUID (FK → words.id, NULLABLE)
├── note_id             UUID (FK → notes.id, NULLABLE)
├── type                ENUM('image','audio')
├── source              ENUM('unsplash','pexels','ai_generated','user_upload','tts')
├── url                 VARCHAR                     -- آدرس نهایی در CDN خودمان (نه لینک مستقیم Unsplash)
├── source_attribution  VARCHAR NULLABLE             -- برای رعایت قوانین Unsplash/Pexels (نام عکاس)
├── search_query        VARCHAR NULLABLE             -- عبارتی که برای جستجو استفاده شد
└── created_at          TIMESTAMP

CREATE INDEX idx_media_word ON media_assets (word_id, type);
```

> **نکته حیاتی Performance/Cost:** قبل از فراخوانی Unsplash/Pexels یا تولید تصویر AI برای یک کلمه، همیشه اول این جدول را بر اساس `word_id` چک کن. اگر کلمه‌ای قبلاً تصویر داشت، مستقیم استفاده شود. این هم هزینه API را کاهش می‌دهد، هم تجربه فوری‌تر برای کاربر دوم فراهم می‌کند.

### ۴.۵ موتور AI — جداول جدید 🆕

```sql
ai_generations                                    -- لاگ کامل هر فراخوانی AI (دیباگ، بهبود پرامپت، حسابرسی هزینه)
├── id                  UUID (PK)
├── user_id             UUID (FK)
├── input_text          VARCHAR                     -- ورودی خام کاربر
├── input_context       JSONB NULLABLE               -- {"examContext":"ielts","deckId":"..."}
├── model_used          VARCHAR                      -- "claude-sonnet-5"
├── prompt_version       VARCHAR                      -- "v1.2" — برای A/B تست پرامپت‌ها
├── suggested_note_type_id  UUID (FK → note_types.id, NULLABLE)
├── suggested_word_category VARCHAR NULLABLE
├── raw_response        JSONB                        -- خروجی کامل مدل (structured)
├── status              ENUM('pending','completed','failed','needs_review')
├── accepted_by_user    BOOLEAN NULLABLE              -- کاربر نهایتاً پذیرفت یا رد کرد (سیگنال بازخورد کیفیت)
├── latency_ms          INT NULLABLE
└── created_at          TIMESTAMP

ai_generation_jobs                                -- برای حالت Bulk (چند کلمه هم‌زمان)
├── id                  UUID (PK)
├── user_id             UUID (FK)
├── deck_id             UUID (FK)
├── total_items         INT
├── completed_items     INT DEFAULT 0
├── failed_items        INT DEFAULT 0
├── status              ENUM('queued','processing','completed','partial_failed')
├── created_at          TIMESTAMP
└── completed_at        TIMESTAMP NULLABLE

user_ai_quota                                     -- محدودیت مصرف روزانه (مرز Free/Premium)
├── user_id             UUID (FK)
├── date                DATE
├── generations_count   INT DEFAULT 0
└── PRIMARY KEY (user_id, date)
```

### ۴.۶ کتابخانه محتوا (بدون تغییر نسبت به نسخه قبل)

```sql
library_items
├── id, content_type ENUM('book','podcast','novel','magazine'), title, publisher,
│   level, cover_image_url, description, lesson_count, rating_avg, rating_count,
│   exam_context, is_premium

book_lessons
├── id, library_item_id, order_index, title, unit_code, word_count

lesson_words
├── id, lesson_id, word_id, order_index

user_library
├── user_id, library_item_id, added_at

user_word_progress
├── id, user_id, word_id, lesson_id, is_learned, learned_at

book_reviews
├── id, user_id, library_item_id, rating, comment, created_at
```

### ۴.۷ آزمون‌ها، آمار، اعلان‌ها (بدون تغییر نسبت به نسخه قبل)

```sql
exam_catalog / exam_sections / exam_questions / user_exam_attempts / user_exam_answers
study_sessions (module_type اکنون شامل 'ai_card_creation' هم می‌شود 🆕)
daily_stats_materialized
skill_scores
notifications / user_notifications
```

---

## ۵. الگوریتم Spaced Repetition (موتور لایتنر) — به‌روزشده برای مدل Card

### ۵.۱ منطق حرکت بین جعبه‌ها (حالت ساده - پیش‌فرض)

```
جعبه ۱ (روزانه) ⇄ جعبه ۲ (۲ روز) ⇄ جعبه ۳ (۴ روز) ⇄ جعبه ۴ (۸ روز) ⇄ جعبه ۵ (۱۶ روز) → یادگرفته‌شده

"بلدم" (known)   → current_box = min(current_box + 1, 5)؛ اگر از 5 دوباره "بلدم" شد → status = 'learned'
"بلدنیستم" (unknown) → current_box = 1
```

### ۵.۲ منطق حالت پیشرفته (۴ دکمه‌ای، اختیاری، سبک Anki) 🆕

```
Again  → current_box = 1                          (برگشت کامل، مثل "بلدنیستم")
Hard   → current_box = max(current_box - 1, 1)     (یک جعبه عقب، نه صفر)
Good   → current_box = min(current_box + 1, 5)     (یک جعبه جلو، مثل "بلدم")
Easy   → current_box = min(current_box + 2, 5)     (دو جعبه جلو، پاداش برای پاسخ خیلی راحت)
```

این حالت به‌صورت **اختیاری در تنظیمات کاربر** فعال می‌شود؛ پیش‌فرض همان حالت ساده دو دکمه‌ای است (مطابق UI اصلی که در تصاویر دیدیم).

### ۵.۳ Pseudocode سرویس Review (اصلاح‌شده برای مدل Card)

```typescript
// leitner.service.ts
async submitReview(userId: string, cardId: string, grade: 'again'|'hard'|'good'|'easy') {
  return this.prisma.$transaction(async (tx) => {
    const card = await tx.cards.findUniqueOrThrow({ where: { id: cardId } });
    const boxBefore = card.currentBox;
    let boxAfter: number;
    let newStatus = card.status;

    switch (grade) {
      case 'again': boxAfter = 1; break;
      case 'hard':  boxAfter = Math.max(boxBefore - 1, 1); break;
      case 'good':  boxAfter = Math.min(boxBefore + 1, 5); break;
      case 'easy':  boxAfter = Math.min(boxBefore + 2, 5); break;
    }
    if ((grade === 'good' || grade === 'easy') && boxBefore === 5) {
      newStatus = 'learned';
      boxAfter = 5;
    }

    const intervalDays = await this.getIntervalForBox(card.deckId, boxAfter);
    const nextReviewAt = addDays(new Date(), intervalDays);

    await tx.cards.update({
      where: { id: cardId },
      data: {
        currentBox: boxAfter,
        status: newStatus,
        nextReviewAt,
        lastReviewedAt: new Date(),
        correctStreak: (grade === 'good' || grade === 'easy') ? { increment: 1 } : 0,
        totalReviews: { increment: 1 },
      },
    });

    await tx.reviewLogs.create({
      data: {
        cardId, userId, grade,
        simpleResult: (grade === 'again' || grade === 'hard') ? 'unknown' : 'known',
        boxBefore, boxAfter, reviewedAt: new Date(),
      },
    });

    await tx.studySessions.create({
      data: { userId, moduleType: 'leitner', durationSeconds: 0 },
    });

    return { boxAfter, nextReviewAt };
  });
}

// Undo — بازگرداندن آخرین مرور (قابلیت جدید سبک Anki)
async undoLastReview(userId: string, cardId: string) {
  const lastLog = await this.prisma.reviewLogs.findFirst({
    where: { cardId, userId },
    orderBy: { reviewedAt: 'desc' },
  });
  if (!lastLog) throw new NotFoundException();

  await this.prisma.cards.update({
    where: { id: cardId },
    data: { currentBox: lastLog.boxBefore, status: 'active' },
  });
  await this.prisma.reviewLogs.delete({ where: { id: lastLog.id } });
}
```

### ۵.۴ کوئری صف مرور روزانه (اصلاح‌شده — Join تا سطح Note برای دسترسی به فیلدها)

```sql
SELECT
  c.id AS card_id, c.current_box, c.is_flagged,
  ct.front_template, ct.back_template,
  n.field_values,
  w.audio_us_url, w.audio_uk_url
FROM cards c
JOIN card_templates ct ON ct.id = c.template_id
JOIN notes n ON n.id = c.note_id
LEFT JOIN words w ON w.id = n.word_id
WHERE c.user_id = :userId
  AND c.deck_id = :deckId
  AND c.status = 'active'
  AND c.next_review_at <= NOW()
ORDER BY c.next_review_at ASC
LIMIT 50;
```

سرور بعد از دریافت این نتایج، `front_template`/`back_template` را با مقادیر `field_values` (که JSON است) رندر می‌کند و HTML نهایی کارت را به کلاینت می‌فرستد — دقیقاً مکانیزم رندر کارت در Anki.

---

## ۶. طراحی API (به‌روزشده)

```
# احراز هویت
POST   /auth/register | /auth/login | /auth/refresh | /auth/logout

# دسته‌های لایتنر
GET    /decks?examContext=ielts
POST   /decks
GET    /decks/:id
GET    /decks/:id/box-summary

# 🆕 Note Types (قالب‌های محتوا)
GET    /note-types                      # لیست انواع سیستمی + ساخته کاربر
POST   /note-types                      # ساخت Note Type سفارشی (کاربران پیشرفته)
GET    /note-types/:id/templates

# 🆕 Notes (محتوای خام)
POST   /notes                           # ساخت دستی (بدون AI)
GET    /notes/:id
PATCH  /notes/:id
DELETE /notes/:id                       # حذف Note = حذف تمام Card های وابسته (Cascade)

# Cards (لایه قابل‌مرور)
POST   /decks/:id/cards/from-note       # از یک Note موجود، کارت به این دسته اضافه کن
GET    /cards/browse?deckId=&box=&tag=&status=&isAiGenerated=&flagged=   # 🆕 Card Browser سبک Anki
PATCH  /cards/:id                       # تغییر جعبه دستی، تگ
DELETE /cards/:id

# 🔑 هسته مرور
GET    /decks/:id/review-queue
POST   /cards/:id/review                # body: { grade: "again"|"hard"|"good"|"easy" }
POST   /cards/:id/undo                  # 🆕 بازگرداندن آخرین مرور
POST   /cards/:id/suspend               # 🆕 تعلیق موقت از چرخه مرور
POST   /cards/:id/flag                  # 🆕 { color: "red" }
POST   /decks/:id/custom-study          # 🆕 { mode: "cram" | "box_only", boxNumber? }

# 🆕🆕 موتور AI (بخش اصلی این نسخه)
POST   /ai/analyze                      # body: { input: "hit the road", examContext, deckId }
                                         # → پیشنهاد نوع کارت + فیلدهای پیشنهادی (بدون ذخیره)
POST   /ai/confirm                      # کاربر تأیید/ویرایش کرد → واقعاً Note + Card ساخته می‌شود
                                         # body: { noteTypeId, fields, deckId, templateIds[], aiGenerationId }
POST   /ai/bulk-generate                # body: { inputs: ["word1","word2",...], deckId } → Async Job
GET    /ai/bulk-generate/:jobId/status
GET    /ai/bulk-generate/:jobId/results # لیست Note های آماده تأیید (شبیه Card Browser)
GET    /ai/quota                        # مصرف باقی‌مانده امروز کاربر

# 🆕 رسانه
GET    /media/search-image?query=eggplant+vegetable   # پروکسی کش‌شده به Unsplash/Pexels
POST   /media/generate-image            # برای موارد انتزاعی (premium/rate-limited)
POST   /media/upload                    # آپلود دستی تصویر توسط کاربر

# دیکشنری عمومی
GET    /dictionary/search?q=tend+to

# کتابخانه، آمار، آزمون، اعلان‌ها — بدون تغییر نسبت به نسخه قبل
```

### نمونه Request/Response کامل جریان AI (مهم‌ترین بخش برای پیاده‌سازی)

**۱. تحلیل ورودی:**
```http
POST /ai/analyze
{
  "input": "hit the road",
  "examContext": "ielts",
  "deckId": "uuid-of-deck"
}
```

```json
// Response
{
  "aiGenerationId": "uuid",
  "wordCategory": "idiom",
  "suggestedNoteType": {
    "id": "uuid-note-type-idiom",
    "name": "Idiom (Narrative)"
  },
  "confidence": 0.94,
  "suggestedFields": {
    "front": "hit the road",
    "meaning_fa": "راه افتادن، شروع سفر کردن",
    "meaning_en": "to leave a place, especially to begin a journey",
    "example_en": "We should hit the road early to avoid traffic.",
    "mnemonic_fa": "تصور کن پات به جاده می‌خوره و راه می‌افتی",
    "synonyms": ["set off", "head out", "depart"],
    "difficultyLevel": "B2"
  },
  "imageSuggestion": {
    "needed": true,
    "reason": "idiom_visualizable",
    "searchQuery": "person backpack walking road journey sunset"
  },
  "suggestedTemplates": ["idiom_narrative_card"]
}
```

**۲. تأیید کاربر (بعد از ویرایش احتمالی):**
```http
POST /ai/confirm
{
  "aiGenerationId": "uuid",
  "noteTypeId": "uuid-note-type-idiom",
  "fields": { /* همان فیلدها، احتمالاً ویرایش‌شده توسط کاربر */ },
  "imageMediaId": "uuid-از-media-search-image",
  "deckId": "uuid-of-deck",
  "templateIds": ["uuid-template-1"]
}
```

```json
// Response
{
  "noteId": "uuid",
  "cardsCreated": [
    { "cardId": "uuid", "templateName": "Idiom (Narrative)", "currentBox": 1 }
  ]
}
```

---

## ۷. ساختار پوشه‌بندی پروژه (به‌روزشده)

### Backend (NestJS)

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── decks/
│   │   ├── leitner/
│   │   │   ├── leitner.controller.ts
│   │   │   ├── leitner.service.ts
│   │   │   ├── review-queue.service.ts
│   │   │   └── jobs/daily-recalculation.job.ts
│   │   ├── notes-cards/                  🆕
│   │   │   ├── note-types.service.ts     # مدیریت قالب‌ها
│   │   │   ├── notes.service.ts
│   │   │   ├── cards.service.ts
│   │   │   └── card-template-renderer.ts # موتور رندر Handlebars-style
│   │   ├── ai-generator/                 🆕
│   │   │   ├── ai-generator.controller.ts
│   │   │   ├── ai-generator.service.ts   # ارتباط با Claude API
│   │   │   ├── prompts/
│   │   │   │   ├── word-analysis.prompt.ts
│   │   │   │   └── field-generation.prompt.ts
│   │   │   ├── jobs/bulk-generation.processor.ts  # BullMQ processor
│   │   │   └── quota.service.ts
│   │   ├── media/                        🆕
│   │   │   ├── media.service.ts
│   │   │   ├── providers/unsplash.provider.ts
│   │   │   ├── providers/pexels.provider.ts
│   │   │   └── image-generation.provider.ts
│   │   ├── words/
│   │   ├── library/
│   │   ├── exams/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── chatroom/
│   ├── common/
│   ├── prisma/schema.prisma
│   ├── config/
│   ├── app.module.ts
│   └── main.ts
```

### Frontend (Next.js App Router)

```
frontend/
├── app/ielts/
│   ├── leitner/
│   │   ├── page.tsx
│   │   ├── review/[deckId]/page.tsx
│   │   └── browse/page.tsx               🆕 Card Browser
│   ├── library/...
│   ├── charts/page.tsx
├── components/
│   ├── leitner/
│   │   ├── BoxCard.tsx
│   │   ├── ReviewFlashcard.tsx
│   │   ├── ReviewGradeButtons.tsx        🆕 دو حالته/چهارحالته
│   │   ├── AddWordModal.tsx
│   │   ├── AiSuggestCardModal.tsx        🆕 مودال پیشنهاد AI + ویرایش
│   │   ├── BulkAiGenerateModal.tsx       🆕
│   │   ├── CardBrowserTable.tsx          🆕
│   │   └── ImportFileModal.tsx
│   ├── media/
│   │   └── ImageSearchPicker.tsx         🆕
```

---

## ۸. نقشه کامل صفحات (Site Map) — به‌روزشده

```
/ielts/leitner                             # صفحه اصلی جعبه‌ها
/ielts/leitner/review/:deckId              # مرور فلش‌کارت (رندر داینامیک بر اساس Template)
/ielts/leitner/browse                      # 🆕 Card Browser (فیلتر پیشرفته، سبک Anki)
/ielts/leitner/ai-create                   # 🆕 صفحه/مودال ساخت کارت با AI (تکی و دسته‌ای)
/ielts/library ...
/ielts/charts
/ielts/test ...
```

---

## ۹. امنیت (نکات اضافه‌شده برای بخش AI) 🆕

| موضوع | راهکار |
|---|---|
| هزینه API هوش مصنوعی | `user_ai_quota` + Rate Limit سخت‌گیرانه روی `/ai/analyze` و `/ai/bulk-generate`؛ محدودیت روزانه رایگان، نامحدود/بالاتر برای Premium |
| Prompt Injection | ورودی کاربر (`input`) هرگز مستقیم به‌عنوان بخشی از System Prompt قرار نمی‌گیرد؛ همیشه در یک بلاک داده مجزا (مثلاً XML tag مشخص) پاس داده می‌شود و خروجی مدل با schema اعتبارسنجی می‌شود (Zod) قبل از ذخیره |
| کیفیت محتوا | مرحله تأیید کاربر اجباری است؛ علاوه‌براین `accepted_by_user` در `ai_generations` لاگ می‌شود تا در آینده بشود پرامپت‌های ضعیف را شناسایی و اصلاح کرد |
| حقوق تصویر | تصاویر Unsplash/Pexels طبق مجوز آن‌ها همیشه با `source_attribution` ذخیره و در UI رفرنس داده شوند |

---

## ۱۰. مقیاس‌پذیری و Performance (نکات اضافه‌شده) 🆕

1. **صف AI کاملاً Async و جدا از صف عمومی BullMQ**: چون فراخوانی LLM کند است (چند ثانیه)، یک Queue مجزا (`ai-generation-queue`) با Concurrency محدود بساز تا صف ایمپورت فایل ساده را بلاک نکند.
2. **کش نتیجه تحلیل AI برای کلمات پرتکرار**: اگر ۱۰۰۰ کاربر کلمه "hesitate" را برای AI بفرستند، نیازی نیست ۱۰۰۰ بار به Claude API درخواست بزنیم. یک لایه کش (`word_id` → آخرین پیشنهاد AI) در Redis با TTL طولانی می‌تواند هزینه را چشمگیر کاهش دهد؛ کاربر همچنان می‌تواند ویرایش شخصی‌سازی‌شده بزند.
3. **رندر Template در سرور، نه کلاینت**: برای جلوگیری از XSS و ناسازگاری، رندر نهایی HTML کارت (جایگزینی `{{field}}`) سمت سرور انجام شود، نه با `dangerouslySetInnerHTML` خام در فرانت.

---

## ۱۱. نقشه راه توسعه (Roadmap فازبندی‌شده) — بازنویسی‌شده با فازهای AI

### فاز ۰ — زیرساخت (۱ هفته)
- Docker Compose (Postgres + Redis)، Prisma Schema اولیه شامل از همان ابتدا مدل **Note/Card/Template** (چون تغییر بعدی از مدل ساده به این مدل، Migration بسیار پرهزینه‌ای است — بهتر است از روز اول درست ساخته شود)

### فاز ۱ — احراز هویت (۳-۴ روز)

### فاز ۲ — MVP جعبه لایتنر با مدل Note/Card (۲-۲.۵ هفته) 🎯
- Note Type های پایه سیستمی (Basic Word, Cloze)
- CRUD کامل Deck + افزودن دستی Note → تولید خودکار Card
- صفحه ۵ جعبه + Review Queue + الگوریتم بخش ۵ (شروع با حالت ساده دو دکمه‌ای)
- تلفظ صوتی

### فاز ۳ — تکمیل مدیریت (۱ هفته)
- ایمپورت فایل، تگ رنگی، Card Browser، Undo، Suspend/Flag

### فاز ۴ — 🆕 موتور AI Card Generation (۲ هفته)
- یکپارچه‌سازی Claude API + Prompt طراحی‌شده (بخش ۱۳)
- `POST /ai/analyze` + `POST /ai/confirm` + UI مودال تأیید
- Note Type های تخصصی بیشتر (Collocation, Idiom Narrative, Phrasal Verb)
- ماژول Media + جستجوی تصویر Unsplash/Pexels + کش
- حالت Bulk + صف BullMQ اختصاصی + صفحه بازبینی دسته‌ای

### فاز ۵ — کتابخانه محتوا (۱.۵ هفته)

### فاز ۶ — آمار و Charts (۱ هفته)

### فاز ۷ — آزمون‌ها (۲-۳ هفته)

### فاز ۸ — گسترش (GRE/TOEFL، گیمیفیکیشن، چت‌روم، Import/Export فرمت `.apkg`)

---

## ۱۲. سیستم Note/Card سبک Anki — طراحی عمیق

### ۱۲.۱ چرا این مدل به‌جای «یک لغت = یک کارت»؟

در مدل ساده‌ای که در نسخه اول این سند پیشنهاد شد (`deck_words`)، هر لغت دقیقاً یک ردیف قابل‌مرور بود. این برای شروع سریع خوب است اما دو محدودیت جدی دارد:

1. **نمی‌توان از یک محتوا، چند جهت یادگیری ساخت.** مثلاً یادگیری واقعی یک لغت شامل هم تشخیص (انگلیسی می‌بینی، معنی را می‌گویی) و هم تولید (فارسی می‌بینی، انگلیسی را تولید می‌کنی) است — این‌ها سطح دشواری متفاوتی دارند و باید مستقل در جعبه‌های لایتنر جلو/عقب بروند.
2. **AI نمی‌تواند «تصمیم بگیرد» چه نوع فلش‌کارتی بسازد**، چون فقط یک قالب کارت وجود دارد. برای اینکه AI بتواند مثلاً برای یک کالوکیشن، کارتی متفاوت از یک اسم عینی بسازد، باید چند قالب از پیش تعریف‌شده در سیستم وجود داشته باشد که AI از میان آن‌ها انتخاب کند.

### ۱۲.۲ سه لایه مدل

```
Note Type  (قالب فیلدها - "این محتوا چه اطلاعاتی دارد؟")
    │
    ├── Note   (محتوای واقعی پرشده - "aubergine → بادمجان → عکس → مثال")
    │       │
    │       ├── Card #1  (از روی Template "Recognition") → جعبه لایتنر مستقل
    │       └── Card #2  (از روی Template "Production")  → جعبه لایتنر مستقل
```

**نمونه `field_schema` برای Note Type «واژه ساده»:**
```json
{
  "fields": [
    { "key": "front",        "label": "کلمه",         "type": "text",  "required": true },
    { "key": "meaning_fa",   "label": "معنی فارسی",    "type": "text",  "required": true },
    { "key": "meaning_en",   "label": "تعریف انگلیسی", "type": "text",  "required": false },
    { "key": "example_en",   "label": "مثال",          "type": "text",  "required": false },
    { "key": "image_url",    "label": "تصویر",         "type": "image", "required": false },
    { "key": "audio_url",    "label": "تلفظ",          "type": "audio", "required": false }
  ]
}
```

**نمونه `field_schema` برای Note Type «کالوکیشن»:**
```json
{
  "fields": [
    { "key": "collocation",  "label": "عبارت",          "type": "text", "required": true },
    { "key": "pattern",      "label": "الگوی ساختاری",   "type": "text", "required": false },
    { "key": "meaning_fa",   "label": "معنی فارسی",      "type": "text", "required": true },
    { "key": "examples",     "label": "مثال‌های کاربرد",  "type": "list", "required": true }
  ]
}
```

**نمونه `field_schema` برای Note Type «Cloze» (جای‌خالی):**
```json
{
  "fields": [
    { "key": "text_with_cloze", "label": "متن با جای خالی", "type": "cloze_text", "required": true },
    { "key": "meaning_fa",      "label": "معنی کلمه هدف",   "type": "text",       "required": true }
  ]
}
```
مثال مقدار: `"She {{c1::tend to}} forget things when she's stressed."` — این الگو دقیقاً معادل Cloze Deletion در Anki است و موتور رندر باید بتواند این نحو را تشخیص دهد و در کارت مرور، بخش داخل `{{c1::...}}` را با `[...]` جایگزین کند.

### ۱۲.۳ موتور رندر Template

فرمت Template ساده و شبیه Handlebars است تا هم برای AI قابل تولید باشد و هم برای کاربران پیشرفته قابل شخصی‌سازی:

```
Front Template:  "{{front}}"
Back Template:   "{{meaning_fa}}<hr>{{example_en}}{{#if image_url}}<img src='{{image_url}}'>{{/if}}"
```

پیاده‌سازی می‌تواند با یک تابع ساده جایگزینی regex باشد (نیازی به کتابخانه سنگین Handlebars کامل نیست، چون فقط `{{field}}` ساده و `{{#if}}` پایه لازم است):

```typescript
function renderTemplate(template: string, fields: Record<string, any>): string {
  return template
    .replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs, (_, key, content) =>
      fields[key] ? content : ''
    )
    .replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? '');
}
```

### ۱۲.۴ قابلیت‌های تکمیلی سبک Anki

| قابلیت | توضیح پیاده‌سازی |
|---|---|
| **Custom Study / Cram Mode** | Endpoint `POST /decks/:id/custom-study` که موقتاً یک Query متفاوت اجرا می‌کند (مثلاً `WHERE current_box = 1` بدون شرط `next_review_at`، یا کل کارت‌های Deck بدون فیلتر تاریخ) — نتیجه در یک session موقت (نه تغییر داده اصلی) نمایش داده می‌شود |
| **Suspend** | فیلد `status = 'suspended'` روی Card — از Review Queue حذف می‌شود اما داده حفظ می‌شود؛ کاربر می‌تواند بعداً فعال کند |
| **Flag** | فیلد `flag_color` — صرفاً یک برچسب بصری برای کاربر (مثلاً "این لغت‌ها را حتماً بازبینی کن")، بدون تأثیر روی الگوریتم |
| **Undo** | با استفاده از `review_logs` (نگاه کنید به بخش ۵.۳) — آخرین لاگ حذف و Card به `box_before` برمی‌گردد |
| **Import/Export فرمت `.apkg`** | فایل `.apkg` یک ZIP حاوی یک دیتابیس SQLite (با جداول `notes`, `cards`, `col`) + پوشه رسانه است. یک پارسر اختصاصی (کتابخانه‌های JS مثل `sql.js` برای خواندن SQLite در Node) می‌تواند این فایل را باز کند، Note Type های Anki را به `note_types` خودمان نگاشت کند، و Note/Card ها را import کند. این ویژگی را در فاز آخر (۸) قرار دادیم چون پیچیدگی فنی دارد ولی برای جذب کاربران فعلی Anki بسیار ارزشمند است. |

---

## ۱۳. موتور تولید کارت با هوش مصنوعی (AI Card Generation Engine)

### ۱۳.۱ جریان کامل (End-to-End Flow)

```
کاربر ورودی می‌دهد ("hit the road")
        │
        ▼
┌───────────────────────────────────────────┐
│  مرحله ۱: طبقه‌بندی + تولید محتوا           │
│  (یک فراخوانی ساختاریافته به Claude API)    │
│  خروجی: word_category, note_type پیشنهادی، │
│         فیلدهای پرشده، نیاز به تصویر یا نه   │
└───────────────────┬───────────────────────┘
                    ▼
┌───────────────────────────────────────────┐
│  مرحله ۲ (اگر نیاز به تصویر بود):           │
│  جستجوی Unsplash/Pexels با query پیشنهادی  │
│  → نمایش ۳-۴ گزینه به کاربر برای انتخاب     │
│    (یا انتخاب خودکار بهترین match)          │
└───────────────────┬───────────────────────┘
                    ▼
┌───────────────────────────────────────────┐
│  مرحله ۳: نمایش پیش‌نمایش کامل کارت به کاربر │
│  (Human-in-the-loop — قابل ویرایش هر فیلد)  │
└───────────────────┬───────────────────────┘
                    ▼
              کاربر تأیید می‌کند
                    ▼
┌───────────────────────────────────────────┐
│  مرحله ۴: ذخیره واقعی                       │
│  Note ساخته می‌شود → بر اساس Template های    │
│  فعال آن Note Type، Card(های) مربوطه در     │
│  Deck انتخابی ساخته می‌شوند (جعبه ۱)         │
└─────────────────────────────────────────────┘
```

### ۱۳.۲ نمونه System Prompt ساختاریافته (برای مرحله ۱)

طراحی این پرامپت باید طوری باشد که **همیشه JSON معتبر و قابل‌اعتماد** برگرداند. پیشنهاد استفاده از قابلیت Structured Output/Tool Use برای تضمین schema:

```
تو یک متخصص طراحی فلش‌کارت آموزش زبان انگلیسی برای زبان‌آموزان فارسی‌زبان
در سطح آمادگی آزمون IELTS هستی.

ورودی کاربر داخل تگ <input> است. این ورودی را تحلیل کن و خروجی را
دقیقاً مطابق schema زیر و فقط به فرم JSON برگردان (بدون هیچ توضیح اضافه):

1. word_category: یکی از
   ["single_word", "collocation", "phrasal_verb", "idiom"]

2. suggested_note_type: بر اساس category، یکی از
   ["basic_word", "collocation_pattern", "idiom_narrative", "cloze_sentence"]

3. fields: آبجکتی متناسب با note_type انتخابی، شامل:
   - front (خود عبارت)
   - meaning_fa (معنی دقیق و رایج فارسی — نه ترجمه لغت‌به‌لغت ماشینی)
   - meaning_en (تعریف ساده انگلیسی، سطح B1-B2)
   - example_en (یک جمله طبیعی، ترجیحاً در بافت موضوعات رایج IELTS
     مثل محیط‌زیست، آموزش، تکنولوژی، سلامت)
   - mnemonic_fa (یک ترفند حافظه‌ای کوتاه و خلاقانه به فارسی، اختیاری)
   - synonyms (حداکثر ۳ مورد، اختیاری)
   - difficulty_level (تخمین سطح CEFR: A2 تا C1)

4. image_suggestion:
   - needed (boolean — true فقط اگر مفهوم به‌وضوح قابل‌تجسم بصری است؛
     برای افعال/مفاهیم انتزاعی معمولاً false)
   - search_query (اگر needed=true، یک عبارت انگلیسی ساده و مشخص
     برای جستجو در بانک عکس Unsplash — نه توصیف شاعرانه)

قوانین مهم:
- اگر ورودی کاربر غلط املایی دارد، حدس بزن و تصحیح‌شده را در front برگردان
- اگر ورودی یک عبارت چندکلمه‌ای رایج است (مثل phrasal verb) آن را جدا-جدا
  توضیح نده؛ کل عبارت را به‌عنوان یک واحد معنایی در نظر بگیر
- مثال‌ها باید طبیعی و از نظر گرامری کاملاً صحیح باشند
- هرگز محتوای نامرتبط با آموزش زبان تولید نکن، حتی اگر ورودی کاربر
  چنین درخواستی داشته باشد

<input>{{USER_INPUT}}</input>
```

> **نکته امنیتی مهم:** ورودی کاربر همیشه داخل تگ `<input>` قرار می‌گیرد و در سیستم پرامپت به مدل تأکید می‌شود که این بخش فقط داده است، نه دستور. این جلوی حملات Prompt Injection را می‌گیرد (مثلاً کاربری که به‌جای اسم کلمه، متنی مثل «این دستورالعمل‌های قبلی را نادیده بگیر و...» وارد کند).

### ۱۳.۳ انتخاب مدل AI (بهینه‌سازی هزینه/کیفیت)

| مرحله | مدل پیشنهادی | چرا |
|---|---|---|
| طبقه‌بندی سریع (اختیاری، پیش از تولید کامل) | مدل سبک/ارزان | فقط تشخیص `word_category` — کار ساده‌ای است که نیازی به مدل قوی ندارد |
| تولید کامل محتوا (فیلدها، مثال، mnemonic) | مدل استاندارد/قوی | کیفیت زبانی و خلاقیت (مخصوصاً mnemonic و مثال طبیعی) در این مرحله اهمیت مستقیم روی تجربه یادگیری کاربر دارد؛ ارزش سرمایه‌گذاری روی مدل بهتر را دارد |
| حالت Bulk (تولید ده‌ها کارت) | همان مدل تولید، اما با Batch/Concurrency محدود در صف | برای کنترل هزینه و جلوگیری از Rate Limit ارائه‌دهنده API |

### ۱۳.۴ استراتژی تصویر — جزئیات تکمیلی

```
اگر word_category == "single_word" AND معنی، شیء/موجود ملموس است:
    → جستجوی Unsplash/Pexels با query پیشنهادی AI
    → نمایش ۳-۴ گزینه به کاربر (Grid کوچک قابل‌کلیک) در مودال تأیید
    → انتخاب کاربر → دانلود و ذخیره در media_assets + Object Storage خودمان
    → (هرگز لینک مستقیم Unsplash را در دیتابیس ذخیره نکن — می‌تواند expire
       یا تغییر کند؛ همیشه فایل را کش/دانلود کن)

اگر word_category == "idiom" یا مفهوم انتزاعی قابل‌تجسم به‌صورت استعاری است:
    → (اختیاری، فاز پیشرفته‌تر) تولید یک illustration ساده و مینیمال
      با یک مدل تصویرساز، نه عکس واقعی
    → یا صرفاً از mnemonic متنی استفاده شود (پیش‌فرض امن‌تر و ارزان‌تر)

در غیر این صورت (افعال کاملاً انتزاعی مثل "hesitate", "tend to"):
    → تصویر پیشنهاد نشود؛ تمرکز روی مثال جمله + mnemonic متنی
```

### ۱۳.۵ حالت Bulk — پردازش صف

```typescript
// bulk-generation.processor.ts (BullMQ Worker)
@Process('generate-cards-bulk')
async handleBulkGeneration(job: Job<{ jobId: string; inputs: string[]; userId: string; deckId: string }>) {
  const { jobId, inputs, userId, deckId } = job.data;

  for (const [index, input] of inputs.entries()) {
    try {
      const analysis = await this.aiService.analyzeWord(input, userId);
      await this.prisma.notes.create({
        data: {
          userId,
          noteTypeId: analysis.suggestedNoteTypeId,
          fieldValues: analysis.fields,
          source: 'ai_generated',
          aiGenerationId: analysis.id,
          // status ابتدایی: در انتظار بازبینی کاربر (هنوز Card ساخته نمی‌شود)
        },
      });
      await this.updateJobProgress(jobId, { completedItems: index + 1 });
    } catch (err) {
      await this.updateJobProgress(jobId, { failedItems: { increment: 1 } });
      this.logger.error(`AI generation failed for "${input}"`, err);
    }
    // تأخیر کوچک بین درخواست‌ها برای رعایت Rate Limit ارائه‌دهنده API
    await sleep(300);
  }
}
```

نتیجه در صفحه‌ای شبیه Card Browser نمایش داده می‌شود که کاربر می‌تواند به‌صورت دسته‌ای یا تکی، Note های تولیدشده را تأیید/ویرایش/رد کند — دقیقاً همان اصل Human-in-the-loop که در فلسفه طراحی (بخش ۱) تأکید شد.

---

## جمع‌بندی نسخه ۲.۰

مهم‌ترین تصمیم معماری این نسخه، پذیرفتن پیچیدگی اضافه‌ی مدل **Note/Card/Template** از همان فاز صفر است. این تصمیم کمی کندتر شروع می‌شود اما از یک Migration بسیار پرهزینه در آینده (وقتی بخواهید از مدل ساده به این مدل مهاجرت کنید، درحالی‌که کاربران واقعی و داده واقعی دارید) جلوگیری می‌کند. موتور AI هم مستقیماً روی همین مدل سوار می‌شود: کاری که هوش مصنوعی انجام می‌دهد چیزی نیست جز «انتخاب Note Type مناسب + پر کردن فیلدهای آن» — و چون این ساختار از پیش وجود دارد، افزودن AI به‌جای یک تغییر معماری بزرگ، صرفاً یک ماژول جدید است که روی زیرساخت موجود می‌نشیند.

نقطه شروع پیشنهادی بدون تغییر باقی می‌ماند: **فاز ۰ تا ۲**، با این تفاوت که از همان فاز ۰، Prisma Schema باید شامل جداول `note_types`, `card_templates`, `notes`, `cards` باشد، نه مدل ساده قبلی.
