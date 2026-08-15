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
  if (!body.front || !body.meaningFa) {
    return NextResponse.json(
      { error: "فیلدهای front و meaningFa الزامی هستند" },
      { status: 400 }
    );
  }

  const result = await notesCardsService.createManualWord({
    userId: user.id,
    deckId,
    front: body.front,
    meaningFa: body.meaningFa,
    exampleEn: body.exampleEn,
    tagNames: Array.isArray(body.tagNames) ? body.tagNames : [],
  });

  return NextResponse.json(result, { status: 201 });
}
