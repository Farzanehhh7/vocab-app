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
    update: {},
    create: {
      id: "cloze_default",
      noteTypeId: cloze.id,
      name: "Cloze",
      frontTemplate: "{{text_with_cloze}}",
      backTemplate: "{{meaning_fa}}",
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

  console.log("✅ Seed کامل شد: 3 Note Type، 3 Card Template، 5 بازه پیش‌فرض جعبه.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
