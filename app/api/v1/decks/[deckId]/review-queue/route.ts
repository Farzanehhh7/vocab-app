import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";
import { LeitnerService } from "@/lib/modules/leitner/service";

const decksService = new DecksService(prisma);
const leitnerService = new LeitnerService(prisma);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { deckId } = await params;
  await decksService.getDeck(user.id, deckId); // مالکیت را چک می‌کند

  const queue = await leitnerService.getReviewQueue(user.id, deckId);
  return NextResponse.json({ queue, count: queue.length });
}
