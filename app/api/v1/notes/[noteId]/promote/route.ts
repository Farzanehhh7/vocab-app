import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";
import { DecksService } from "@/lib/modules/decks/service";

const notesCardsService = new NotesCardsService(prisma);
const decksService = new DecksService(prisma);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { noteId } = await params;
  const body = await req.json();
  if (!body.deckId || typeof body.deckId !== "string") {
    return NextResponse.json({ error: "deckId الزامی است" }, { status: 400 });
  }

  try {
    await decksService.getDeck(user.id, body.deckId); // مالکیت Deck رو چک می‌کنه
    const result = await notesCardsService.promoteNoteToCard(user.id, noteId, body.deckId);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
