/**
 * Seed اولیه دیتابیس — طبق فاز ۱ نقشه راه:
 * فقط ۲ Note Type سیستمی (basic_word, cloze_sentence) + بازه‌های پیش‌فرض جعبه‌ها.
 *
 * اجرا: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ---- Note Type: واژه ساده ----
  const basicWord = await prisma.noteType.upsert({
    where: { id: "basic_word" },
    update: {},
    create: {
      id: "basic_word",
      name: "واژه ساده (Basic Word)",
      isSystem: true,
      fieldSchema: {
        fields: [
          { key: "front", label: "کلمه", type: "text", required: true },
          { key: "meaning_fa", label: "معنی فارسی", type: "text", required: true },
          { key: "example_en", label: "مثال", type: "text", required: false },
        ],
      },
    },
  });

  await prisma.cardTemplate.upsert({
    where: { id: "basic_word_recognition" },
    update: {},
    create: {
      id: "basic_word_recognition",
      noteTypeId: basicWord.id,
      name: "Recognition (En → Fa)",
      frontTemplate: "{{front}}",
      backTemplate: "{{meaning_fa}}<hr>{{example_en}}",
      orderIndex: 0,
      isActive: true,
    },
  });

  // ---- Note Type: Cloze (جای خالی) ----
  const cloze = await prisma.noteType.upsert({
    where: { id: "cloze_sentence" },
    update: {},
    create: {
      id: "cloze_sentence",
      name: "جمله با جای خالی (Cloze)",
      isSystem: true,
      fieldSchema: {
        fields: [
          { key: "text_with_cloze", label: "متن با جای خالی", type: "cloze_text", required: true },
          { key: "meaning_fa", label: "معنی کلمه هدف", type: "text", required: true },
        ],
      },
    },
  });

  await prisma.cardTemplate.upsert({
    where: { id: "cloze_default" },
    update: {
      frontTemplate: "{{{cloze_front_html}}}",
      backTemplate: "{{{cloze_back_html}}}<hr>{{meaning_fa}}",
    },
    create: {
      id: "cloze_default",
      noteTypeId: cloze.id,
      name: "Cloze",
      frontTemplate: "{{{cloze_front_html}}}",
      backTemplate: "{{{cloze_back_html}}}<hr>{{meaning_fa}}",
      orderIndex: 0,
      isActive: true,
    },
  });

  // ---- Note Type: واژه با چند مثال (ضد حفظ‌کردن مکانیکی) ----
  // هر بار مرور، از بین مثال‌های ذخیره‌شده یک زیرمجموعه تصادفی نشون داده می‌شه
  // — طبق DECISIONS.md ورودی ۰۰۸، برای جلوگیری از یادگیری سطحیِ یک جمله ثابت.
  const wordWithExamples = await prisma.noteType.upsert({
    where: { id: "word_with_examples" },
    update: {},
    create: {
      id: "word_with_examples",
      name: "واژه با چند مثال",
      isSystem: true,
      fieldSchema: {
        fields: [
          { key: "front", label: "کلمه یا عبارت", type: "text", required: true },
          { key: "examples", label: "مثال‌ها (چندتایی)", type: "list", required: true },
          { key: "meaning_fa", label: "توضیحات (پشت کارت)", type: "text", required: true },
          { key: "notes", label: "نکات تکمیلی", type: "text", required: false },
        ],
      },
    },
  });

  await prisma.cardTemplate.upsert({
    where: { id: "word_with_examples_default" },
    update: {},
    create: {
      id: "word_with_examples_default",
      noteTypeId: wordWithExamples.id,
      name: "چند مثال",
      frontTemplate:
        '<div style="font-size:24px;font-weight:800;">{{front}}</div>{{{examples_html}}}',
      backTemplate:
        '<div style="font-size:18px;font-weight:700;">{{meaning_fa}}</div>{{#if notes}}<div style="margin-top:10px;font-size:13px;">{{notes}}</div>{{/if}}',
      orderIndex: 0,
      isActive: true,
    },
  });

  // ---- Note Type: جمله کاربردی من (بانک شخصی، بدون ساخت خودکار کارت) ----
  // برخلاف بقیه Note Type ها، این یکی موقع ساخته‌شدن هیچ Card ای نمی‌سازه —
  // چون Template‌اش isActive:false هست (createNote فقط برای Template های
  // فعال Card می‌سازه). فقط وقتی کاربر صریحاً «تبدیل به فلش‌کارت» بزنه،
  // NotesCardsService.promoteNoteToCard صدا زده می‌شه و همین Template
  // (غیرفعال) رو مستقیم برای ساخت Card استفاده می‌کنه.
  const usefulSentence = await prisma.noteType.upsert({
    where: { id: "useful_sentence" },
    update: {},
    create: {
      id: "useful_sentence",
      name: "جمله کاربردی من",
      isSystem: true,
      fieldSchema: {
        fields: [
          { key: "front", label: "جمله", type: "text", required: true },
          { key: "examples", label: "مثال‌های کاربرد (چندتایی)", type: "list", required: false },
          { key: "meaning_en", label: "تعریف انگلیسی (اختیاری)", type: "text", required: false },
        ],
      },
    },
  });

  await prisma.cardTemplate.upsert({
    where: { id: "useful_sentence_default" },
    update: {},
    create: {
      id: "useful_sentence_default",
      noteTypeId: usefulSentence.id,
      name: "مرور جمله",
      frontTemplate: "{{front}}{{{examples_html}}}",
      backTemplate: "{{meaning_en}}",
      orderIndex: 0,
      isActive: false, // 🔑 عمداً غیرفعال — نگاه کن به کامنت بالا
    },
  });

  // ---- کتابخانه محتوا: یک منبع نمونه + یک درس (Unit 40) ----
  // فقط یک درس دستی برای شروع، تا مطمئن بشیم UI جواب می‌ده قبل از
  // سرمایه‌گذاری روی محتوای بیشتر (طبق DECISIONS.md ورودی ۰۱۲).
  const vocabInUse = await prisma.source.upsert({
    where: { id: "vocab_in_use" },
    update: {},
    create: { id: "vocab_in_use", title: "English Vocabulary in Use", type: "book", level: "intermediate" },
  });

  await prisma.lesson.upsert({
    where: { id: "vocab_in_use_unit_40" },
    update: {},
    create: {
      id: "vocab_in_use_unit_40",
      sourceId: vocabInUse.id,
      orderIndex: 40,
      title: "Business and finance",
      unitCode: "Unit 40",
      contentBlocks: [
        { type: "section_label", text: "A" },
        {
          type: "paragraph",
          text: "Rise and fall. These verbs describe trends [movements] in sales [how much you sell], prices, etc.",
        },
        {
          type: "paragraph",
          text: "When sales or prices rise / go up / increase, they can do it in different ways:",
        },
        {
          type: "paragraph",
          text:
            "They can rise slightly [a bit].\nThey can rise gradually [slowly over a long period].\nThey can rise sharply [quickly and by a large amount].",
        },
        {
          type: "paragraph",
          text:
            "The opposite can also happen. Prices or sales can fall / go down / decrease slightly, gradually or sharply. If prices don't rise or fall, they stay the same.",
        },
        {
          type: "paragraph",
          text:
            "We use certain prepositions to say by how much something rises or falls. The price has risen by 10 pence. Sales fell from 8,000 units to 6,500 units.",
        },
        {
          type: "paragraph",
          text:
            "Rise/increase and fall/decrease can also be used as nouns, with certain prepositions. There's been a gradual rise in prices. We've seen a slight increase in profit. There's been a sharp fall in sales. Profits were £5 million, which is a decrease of 10%.",
        },
        {
          type: "language_help",
          title: "Language help",
          text:
            "Profit is the money you receive from your business after you have paid all your costs (opp loss). Last year the company made a profit of €2 million but this year they could make a loss.",
        },
      ],
      vocabItems: {
        create: [
          { term: "rise / increase", meaningFa: "افزایش پیدا کردن", exampleEn: "Sales rose sharply last quarter.", orderIndex: 0 },
          { term: "fall / decrease", meaningFa: "کاهش پیدا کردن", exampleEn: "Profits fell slightly in March.", orderIndex: 1 },
          { term: "gradually", meaningFa: "به‌تدریج", exampleEn: "The economy improved gradually over five years.", orderIndex: 2 },
          { term: "sharply", meaningFa: "به‌شدت، ناگهانی", exampleEn: "Oil prices rose sharply after the announcement.", orderIndex: 3 },
          { term: "stay the same", meaningFa: "ثابت ماندن", exampleEn: "Unemployment rates stayed the same this year.", orderIndex: 4 },
          { term: "profit / loss", meaningFa: "سود / زیان", exampleEn: "The company made a profit of £2 million.", orderIndex: 5 },
        ],
      },
    },
  });

  // ---- دسته‌بندی موضوعی («گلچین لغات پرکاربرد») ----
  const businessCategory = await prisma.category.upsert({
    where: { id: "business_finance" },
    update: {},
    create: { id: "business_finance", name: "Business & Finance", slug: "business-finance" },
  });
  const unit40Vocab = await prisma.lessonVocab.findMany({ where: { lessonId: "vocab_in_use_unit_40" } });
  for (const vocab of unit40Vocab) {
    await prisma.lessonVocabCategory.upsert({
      where: { lessonVocabId_categoryId: { lessonVocabId: vocab.id, categoryId: businessCategory.id } },
      update: {},
      create: { lessonVocabId: vocab.id, categoryId: businessCategory.id },
    });
  }

  // ---- بازه‌های پیش‌فرض جعبه‌های لایتنر (global، deckId = null) ----
  const defaultIntervals = [
    { boxNumber: 1, intervalDays: 0 }, // روزانه
    { boxNumber: 2, intervalDays: 2 },
    { boxNumber: 3, intervalDays: 4 },
    { boxNumber: 4, intervalDays: 8 },
    { boxNumber: 5, intervalDays: 16 },
  ];

  for (const interval of defaultIntervals) {
    const existing = await prisma.leitnerBoxInterval.findFirst({
      where: { deckId: null, boxNumber: interval.boxNumber },
    });
    if (!existing) {
      await prisma.leitnerBoxInterval.create({ data: { deckId: null, ...interval } });
    }
  }

  console.log(
    "✅ Seed کامل شد: 4 Note Type، 4 Card Template، 1 منبع کتابخانه (Unit 40 + 1 دسته‌بندی)، 5 بازه پیش‌فرض جعبه."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
