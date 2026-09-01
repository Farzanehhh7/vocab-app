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
  if (!body.example || typeof body.example !== "string") {
    return NextResponse.json({ error: "example الزامی است" }, { status: 400 });
  }

  try {
    const note = await notesCardsService.addExample(user.id, noteId, body.example);
    return NextResponse.json({ note });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
