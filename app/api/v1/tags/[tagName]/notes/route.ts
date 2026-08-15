import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService } from "@/lib/modules/tags/service";

const tagsService = new TagsService(prisma);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tagName: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { tagName } = await params;
  const notes = await tagsService.getNotesByTag(user.id, decodeURIComponent(tagName));
  return NextResponse.json({ notes });
}
