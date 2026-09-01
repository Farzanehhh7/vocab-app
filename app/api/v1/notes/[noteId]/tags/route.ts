import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";

const notesCardsService = new NotesCardsService(prisma);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  if (!body.tagName || typeof body.tagName !== "string") {
    return NextResponse.json({ error: "tagName الزامی است" }, { status: 400 });
  }

  try {
    await notesCardsService.addTag(user.id, noteId, body.tagName.trim());
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
