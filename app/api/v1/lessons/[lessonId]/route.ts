import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";

const libraryService = new LibraryService(prisma);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { lessonId } = await params;
  try {
    const lesson = await libraryService.getLessonDetail(lessonId, user.id);
    return NextResponse.json({ lesson });
  } catch {
    return NextResponse.json({ error: "درس پیدا نشد" }, { status: 404 });
  }
}
