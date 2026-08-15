import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";

const decksService = new DecksService(prisma);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const decks = await decksService.listDecks(user.id);
  return NextResponse.json({ decks });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "نام دسته الزامی است" }, { status: 400 });
  }

  const deck = await decksService.createDeck(user.id, body.name, body.examContext ?? "ielts");
  return NextResponse.json({ deck }, { status: 201 });
}
