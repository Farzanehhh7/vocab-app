import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LeitnerService } from "@/lib/modules/leitner/service";

const leitnerService = new LeitnerService(prisma);

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const deckId = url.searchParams.get("deckId") ?? undefined;
  const boxParam = url.searchParams.get("box");
  const status = url.searchParams.get("status") ?? undefined;
  const flaggedOnly = url.searchParams.get("flaggedOnly") === "true";

  const cards = await leitnerService.browseCards(user.id, {
    search,
    deckId,
    box: boxParam ? Number(boxParam) : undefined,
    status,
    flaggedOnly,
  });

  return NextResponse.json({ cards });
}
