import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";

const decksService = new DecksService(prisma);
const notesCardsService = new NotesCardsService(prisma);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { deckId } = await params;
  await decksService.getDeck(user.id, deckId); // مالکیت را چک می‌کند

  const body = await req.json();
  if (!Array.isArray(body.rows)) {
    return NextResponse.json({ error: "فیلد rows باید آرایه باشد" }, { status: 400 });
  }

  try {
    const result = await notesCardsService.bulkImportBasicWords(user.id, deckId, body.rows);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
