import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";

const libraryService = new LibraryService(prisma);

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ highlightId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { highlightId } = await params;
  try {
    await libraryService.removeHighlight(user.id, highlightId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطا در حذف Highlight" },
      { status: 400 }
    );
  }
}
