import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";

const decksService = new DecksService(prisma);
const notesCardsService = new NotesCardsService(prisma);

/**
 * نسخه عمومی POST /decks/:deckId/words — با هر Note Type کار می‌کنه،
 * نه فقط basic_word. برای Note Type های جدید (مثل word_with_examples)
 * به‌جای اضافه کردن Endpoint اختصاصی، همین یکی استفاده می‌شه.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { deckId } = await params;
  await decksService.getDeck(user.id, deckId); // مالکیت را چک می‌کند

  const body = await req.json();
  if (!body.noteTypeId || !body.fieldValues || typeof body.fieldValues !== "object") {
    return NextResponse.json(
      { error: "فیلدهای noteTypeId و fieldValues الزامی هستند" },
      { status: 400 }
    );
  }

  try {
    const result = await notesCardsService.createNote({
      userId: user.id,
      deckId,
      noteTypeId: body.noteTypeId,
      fieldValues: body.fieldValues,
      tagNames: Array.isArray(body.tagNames) ? body.tagNames : [],
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
