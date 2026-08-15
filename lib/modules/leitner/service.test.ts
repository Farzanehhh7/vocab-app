/**
 * تست واحد الگوریتم لایتنر
 * طبق قانون ۵ نقشه راه Solo-Founder: «روی منطق حساس تست بنویس، نه همه‌چیز»
 *
 * این تست‌ها فقط توابع خالص (calculateNextBox, isKnownGrade) رو چک می‌کنن،
 * بدون نیاز به دیتابیس واقعی — سریع، قابل‌اعتماد، و همیشه باید سبز بمونن.
 * اجرا: npm run test
 */
import { describe, it, expect } from "vitest";
import { calculateNextBox, isKnownGrade, buildDynamicFields } from "./service";

describe("calculateNextBox — منطق حرکت بین جعبه‌ها", () => {
  it("grade=again همیشه به جعبه ۱ برمی‌گردد", () => {
    expect(calculateNextBox(1, "again")).toBe(1);
    expect(calculateNextBox(3, "again")).toBe(1);
    expect(calculateNextBox(5, "again")).toBe(1);
  });

  it("grade=hard یک جعبه عقب می‌رود، ولی زیر ۱ نمی‌رود", () => {
    expect(calculateNextBox(3, "hard")).toBe(2);
    expect(calculateNextBox(1, "hard")).toBe(1); // نباید صفر یا منفی بشه
  });

  it("grade=good یک جعبه جلو می‌رود، ولی از ۵ رد نمی‌شود", () => {
    expect(calculateNextBox(1, "good")).toBe(2);
    expect(calculateNextBox(4, "good")).toBe(5);
    expect(calculateNextBox(5, "good")).toBe(5); // سقف
  });

  it("grade=easy دو جعبه جلو می‌رود، ولی از ۵ رد نمی‌شود", () => {
    expect(calculateNextBox(1, "easy")).toBe(3);
    expect(calculateNextBox(4, "easy")).toBe(5);
    expect(calculateNextBox(5, "easy")).toBe(5); // سقف
  });

  it("هرگز خروجی خارج از بازه ۱ تا ۵ نمی‌دهد (fuzz ساده)", () => {
    const grades = ["again", "hard", "good", "easy"] as const;
    for (let box = 1; box <= 5; box++) {
      for (const grade of grades) {
        const result = calculateNextBox(box, grade);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe("isKnownGrade — تشخیص بلدم/بلدنیستم برای آمار", () => {
  it("good و easy به‌عنوان known محسوب می‌شوند", () => {
    expect(isKnownGrade("good")).toBe(true);
    expect(isKnownGrade("easy")).toBe(true);
  });

  it("again و hard به‌عنوان unknown محسوب می‌شوند", () => {
    expect(isKnownGrade("again")).toBe(false);
    expect(isKnownGrade("hard")).toBe(false);
  });
});

describe("buildDynamicFields — جلوگیری از حفظ‌کردن مکانیکی (DECISIONS.md ۰۰۸)", () => {
  it("وقتی examples وجود نداره، fieldValues رو دست‌نخورده برمی‌گردونه", () => {
    const input = { front: "hesitate", meaning_fa: "تردید کردن" };
    expect(buildDynamicFields(input)).toEqual(input);
  });

  it("وقتی examples خالیه، examples_html اضافه نمی‌کنه", () => {
    const input = { front: "hesitate", examples: [] };
    const result = buildDynamicFields(input);
    expect(result.examples_html).toBeUndefined();
  });

  it("وقتی examples پر باشه، examples_html می‌سازه با حداکثر ۲ مورد", () => {
    const input = {
      front: "hesitate",
      examples: ["Example one.", "Example two.", "Example three.", "Example four."],
    };
    const result = buildDynamicFields(input) as { examples_html: string };
    const liCount = (result.examples_html.match(/<li>/g) ?? []).length;
    expect(liCount).toBe(2); // EXAMPLES_SHOWN_PER_REVIEW = 2
  });

  it("اگه مثال‌ها کمتر از حد نمایش باشن، همون تعداد موجود رو نشون می‌ده", () => {
    const input = { front: "hesitate", examples: ["Only one example."] };
    const result = buildDynamicFields(input) as { examples_html: string };
    const liCount = (result.examples_html.match(/<li>/g) ?? []).length;
    expect(liCount).toBe(1);
  });

  it("محتوای مثال رو Escape می‌کنه (جلوگیری از XSS)", () => {
    const input = { front: "test", examples: ["<script>alert(1)</script>"] };
    const result = buildDynamicFields(input) as { examples_html: string };
    expect(result.examples_html).not.toContain("<script>");
    expect(result.examples_html).toContain("&lt;script&gt;");
  });

  it("در فراخوانی‌های متعدد، امکان انتخاب زیرمجموعه‌های متفاوت وجود دارد (fuzz)", () => {
    const input = {
      front: "hesitate",
      examples: ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H."],
    };
    const seenCombinations = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const result = buildDynamicFields(input) as { examples_html: string };
      seenCombinations.add(result.examples_html);
    }
    // با ۸ گزینه و انتخاب ۲تایی، در ۳۰ بار تلاش تصادفی، معقوله که بیشتر از
    // یک ترکیب دیده بشه — این تضمین می‌کنه واقعاً هر بار ثابت نمی‌مونه
    expect(seenCombinations.size).toBeGreaterThan(1);
  });
});
