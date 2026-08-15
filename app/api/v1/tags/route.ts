import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService } from "@/lib/modules/tags/service";

const tagsService = new TagsService(prisma);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const tags = await tagsService.listTagsWithCounts(user.id);
  return NextResponse.json({ tags });
}
