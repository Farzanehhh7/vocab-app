import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { AiService } from "@/lib/modules/ai/service";

const aiService = new AiService();
const MAX_EXAMPLES = 6; // محافظت ساده در برابر سو‌ءاستفاده؛ Quota کامل طبق نقشه راه در فاز ۶ اضافه می‌شه

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const body = await req.json();
  if (!body.word || typeof body.word !== "string") {
    return NextResponse.json({ error: "فیلد word الزامی است" }, { status: 400 });
  }

  const count = Math.min(Number(body.count) || 4, MAX_EXAMPLES);

  try {
    const result = await aiService.suggestExamples(body.word, count);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در تولید مثال" },
      { status: 500 }
    );
  }
}
