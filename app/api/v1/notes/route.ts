import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { NotesCardsService } from "@/lib/modules/notes-cards/service";

const notesCardsService = new NotesCardsService(prisma);

/** GET /api/v1/notes?noteTypeId=&search= — لیست Note های خود کاربر */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const notes = await notesCardsService.listNotes(user.id, {
    noteTypeId: searchParams.get("noteTypeId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });
  return NextResponse.json({ notes });
}
