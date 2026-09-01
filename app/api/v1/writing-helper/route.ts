import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService } from "@/lib/modules/tags/service";
import { LibraryService } from "@/lib/modules/library/service";
import { extractPrimaryText } from "@/lib/modules/leitner/service";

const tagsService = new TagsService(prisma);
const libraryService = new LibraryService(prisma);

function extractMeaning(fieldValues: Record<string, unknown>): string {
  const candidateKeys = ["meaning_fa", "meaning_en"];
  for (const key of candidateKeys) {
    const value = fieldValues[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/**
 * دستیار رایتینگ — چند تگ شخصی و/یا چند دسته‌بندی مشترک رو هم‌زمان
 * انتخاب کن، لغات مرتبط (از هر دو منبع) رو ببین. چیز جدیدی تو دیتابیس
 * ذخیره نمی‌کنه؛ فقط دو تا Service موجود رو با هم ترکیب می‌کنه.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "احراز هویت لازم است" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tagNames = (searchParams.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const categorySlugs = (searchParams.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const [taggedNotes, vocabItems] = await Promise.all([
    tagsService.getNotesByTags(user.id, tagNames),
    libraryService.getVocabByCategories(categorySlugs),
  ]);

  return NextResponse.json({
    personalWords: taggedNotes.map((n) => ({
      noteId: n.noteId,
      term: extractPrimaryText(n.fieldValues),
      meaning: extractMeaning(n.fieldValues),
      tags: n.tags,
    })),
    sharedWords: vocabItems.map((v) => ({
      id: v.id,
      term: v.term,
      meaning: v.meaningFa,
      lessonId: v.lessonId,
      lessonTitle: v.lessonTitle,
    })),
  });
}
