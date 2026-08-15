import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LeitnerService } from "@/lib/modules/leitner/service";

const leitnerService = new LeitnerService(prisma);

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { cardId } = await params;
  try {
    const result = await leitnerService.toggleSuspend(user.id, cardId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "خطای نامشخص" },
      { status: 400 }
    );
  }
}
