import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";
import { DecksService } from "@/lib/modules/decks/service";
import { LessonReader, type ContentBlock } from "@/components/library/LessonReader";

const libraryService = new LibraryService(prisma);
const decksService = new DecksService(prisma);

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { lessonId } = await params;

  const [lesson, decks] = await Promise.all([
    libraryService.getLessonDetail(lessonId, user.id).catch(() => null),
    decksService.listDecks(user.id),
  ]);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-center text-muted">
        این درس پیدا نشد.{" "}
        <Link href="/library" className="text-brand underline">
          بازگشت به کتابخانه
        </Link>
      </div>
    );
  }

  const lessonForClient = {
    id: lesson.id,
    title: lesson.title,
    unitCode: lesson.unitCode,
    source: lesson.source,
    contentBlocks: lesson.contentBlocks as unknown as ContentBlock[],
    vocabItems: lesson.vocabItems.map((v) => ({
      id: v.id,
      term: v.term,
      meaningFa: v.meaningFa,
      exampleEn: v.exampleEn,
    })),
    highlights: lesson.highlights.map((h) => ({
      id: h.id,
      blockIndex: h.blockIndex,
      startOffset: h.startOffset,
      endOffset: h.endOffset,
      style: h.style,
    })),
  };

  return <LessonReader lesson={lessonForClient} decks={decks} />;
}
