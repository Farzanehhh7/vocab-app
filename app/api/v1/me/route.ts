import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  return NextResponse.json({
    id: user.id,
    username: user.username,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    preferAdvancedGrading: user.preferAdvancedGrading,
  });
}

/** آپدیت تنظیمات کاربر — فعلاً فقط preferAdvancedGrading (حالت ۴ دکمه‌ای) */
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const body = await req.json();
  if (typeof body.preferAdvancedGrading !== "boolean") {
    return NextResponse.json(
      { error: "preferAdvancedGrading باید boolean باشد" },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { preferAdvancedGrading: body.preferAdvancedGrading },
  });

  return NextResponse.json({ preferAdvancedGrading: updated.preferAdvancedGrading });
}
