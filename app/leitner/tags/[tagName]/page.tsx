import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService, type TaggedNote } from "@/lib/modules/tags/service";
import { toPersianDigits } from "@/components/leitner/BoxCard";

const tagsService = new TagsService(prisma);

export default async function TagDetailPage({
  params,
}: {
  params: Promise<{ tagName: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { tagName } = await params;
  const decodedTagName = decodeURIComponent(tagName);
  const notes = await tagsService.getNotesByTag(user.id, decodedTagName);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">#{decodedTagName}</h1>
        <Link href="/leitner/tags" className="text-sm text-brand underline">
          همه تگ‌ها
        </Link>
      </div>

      <div className="space-y-3">
        {notes.map((note: TaggedNote) => {
          const fieldValues = note.fieldValues as { front?: string; meaning_fa?: string };
          return (
            <div
              key={note.noteId}
              className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{fieldValues.front}</div>
                  <div className="text-sm text-muted">{fieldValues.meaning_fa}</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {note.cards.map((card) => (
                    <span
                      key={card.cardId}
                      className="rounded-full bg-background px-2 py-1 text-xs text-muted"
                    >
                      {card.deckName} · جعبه {toPersianDigits(card.currentBox)}
                    </span>
                  ))}
                </div>
              </div>
              {note.tags.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {note.tags
                    .filter((t) => t !== decodedTagName)
                    .map((t) => (
                      <Link
                        key={t}
                        href={`/leitner/tags/${encodeURIComponent(t)}`}
                        className="text-xs text-brand hover:underline"
                      >
                        #{t}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
