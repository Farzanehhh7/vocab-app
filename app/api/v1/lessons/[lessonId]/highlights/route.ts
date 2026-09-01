import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";

const libraryService = new LibraryService(prisma);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const { blockIndex, startOffset, endOffset, style } = body ?? {};

  if (
    typeof blockIndex !== "number" ||
    typeof startOffset !== "number" ||
    typeof endOffset !== "number" ||
    typeof style !== "string"
  ) {
    return NextResponse.json({ error: "ورودی Highlight ناقص است" }, { status: 400 });
  }

  try {
    const highlight = await libraryService.addHighlight(user.id, lessonId, {
      blockIndex,
      startOffset,
      endOffset,
      style,
    });
    return NextResponse.json({ highlight }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در ذخیره Highlight" },
      { status: 400 }
    );
  }
}
