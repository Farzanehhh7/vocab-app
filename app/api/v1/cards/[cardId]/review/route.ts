import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LeitnerService } from "@/lib/modules/leitner/service";
import { StreakService } from "@/lib/modules/users/streak-service";
import type { ReviewGrade } from "@/lib/modules/leitner/types";

const leitnerService = new LeitnerService(prisma);
const streakService = new StreakService(prisma);
const VALID_GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { cardId } = await params;
  const body = await req.json();

  // پشتیبانی از هر دو حالت: ساده (known/unknown) و پیشرفته (grade مستقیم)
  // طبق بخش ۵.۲ سند معماری — پیش‌فرض UI همان حالت ساده دو دکمه‌ای است
  let grade: ReviewGrade;
  if (body.result === "known") grade = "good";
  else if (body.result === "unknown") grade = "again";
  else if (VALID_GRADES.includes(body.grade)) grade = body.grade;
  else {
    return NextResponse.json(
      { error: "grade یا result معتبر ارسال نشده است" },
      { status: 400 }
    );
  }

  try {
    const result = await leitnerService.submitReview(user.id, cardId, grade);
    const streak = await streakService.recordActivity(user.id);
    return NextResponse.json({ ...result, streak: streak.currentStreak });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
