import Anthropic from "@anthropic-ai/sdk";

/**
 * ماژول AI — هسته اولیه‌ی موتور تولید کارت با هوش مصنوعی (بخش ۱۳ سند معماری).
 * طبق نقشه راه، پیاده‌سازی کامل این ماژول برای فاز ۶ برنامه‌ریزی شده بود، ولی
 * این تکه‌ی محدود (پیشنهاد چند مثال متنوع) طبق درخواست مستقیم کاربر و DECISIONS.md
 * ورودی ۰۰۸ زودتر پیاده‌سازی شد — چون هم کم‌هزینه‌ست، هم مستقیم به مشکل
 * «حفظ‌کردن مکانیکی به‌جای یادگیری واقعی» جواب می‌ده.
 *
 * هدف پرامپت: مثال‌های متنوع (نه فرمول‌های تکراری) در سطح مناسب آیلتس،
 * تا وقتی موقع مرور یکی رو تصادفی نشون می‌دیم، واقعاً بافت‌های متفاوتی باشن.
 */

interface SuggestExamplesResult {
  examples: string[];
}

export class AiService {
  private client: Anthropic | null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  async suggestExamples(word: string, count = 4): Promise<SuggestExamplesResult> {
    if (!this.client) {
      throw new Error(
        "ANTHROPIC_API_KEY تنظیم نشده — این فیچر نیاز به کلید API دارد (به .env.local اضافه کن)."
      );
    }

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 500,
      system: `تو یک متخصص طراحی محتوای آموزش زبان انگلیسی برای زبان‌آموزان سطح
آمادگی آزمون IELTS هستی.

ورودی داخل تگ <word> یک کلمه یا عبارت انگلیسیه. باید ${count} جمله نمونه‌ی
طبیعی و روان با این کلمه/عبارت بسازی که این ویژگی‌ها رو داشته باشن:

- هر جمله در یک **بافت موضوعی متفاوت** باشه (مثلاً یکی محیط‌زیست، یکی
  تحصیل، یکی کار، یکی زندگی روزمره) — چون این جمله‌ها قراره به‌صورت
  تصادفی و متناوب به زبان‌آموز نشون داده بشن تا مجبور بشه خودِ کلمه رو
  واقعاً بفهمه، نه یک جمله ثابت رو حفظ کنه
- **ساختار گرامری متفاوت** داشته باشن (نه همه با یک الگوی یکسان شروع بشن)
- سطح زبان B1 تا B2 (متناسب با IELTS) و از نظر گرامری کاملاً صحیح
- طول متوسط (نه خیلی کوتاه، نه پیچیده)

فقط و فقط یک آرایه JSON از رشته‌ها برگردون، بدون هیچ توضیح اضافه یا
Markdown، دقیقاً به این شکل: ["جمله اول", "جمله دوم", ...]`,
      messages: [{ role: "user", content: `<word>${word}</word>` }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("پاسخ نامعتبر از مدل دریافت شد.");
    }

    const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("خروجی مدل قابل تجزیه به JSON نبود.");
    }

    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
      throw new Error("فرمت خروجی مدل نامعتبر بود.");
    }

    return { examples: parsed };
  }
}
