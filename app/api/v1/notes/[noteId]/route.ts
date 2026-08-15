import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";

const notesCardsService = new NotesCardsService(prisma);

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  if (!body.fieldValues || typeof body.fieldValues !== "object") {
    return NextResponse.json({ error: "fieldValues الزامی است" }, { status: 400 });
  }

  try {
    const note = await notesCardsService.updateNoteFields(user.id, noteId, body.fieldValues);
    return NextResponse.json({ note });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { noteId } = await params;
  try {
    await notesCardsService.deleteNote(user.id, noteId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
