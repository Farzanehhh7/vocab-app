import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";
import { LeitnerService } from "@/lib/modules/leitner/service";
import { BoxCard, toPersianDigits } from "@/components/leitner/BoxCard";
import { AddWordModal } from "@/components/leitner/AddWordModal";
import { AddWordWithExamplesModal } from "@/components/leitner/AddWordWithExamplesModal";
import { AddClozeModal } from "@/components/leitner/AddClozeModal";
import { ImportFileModal } from "@/components/leitner/ImportFileModal";
import { CreateDeckModal } from "@/components/leitner/CreateDeckModal";
import { DeckSwitcher } from "@/components/leitner/DeckSwitcher";

const decksService = new DecksService(prisma);
const leitnerService = new LeitnerService(prisma);

export default async function DeckDashboardPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { deckId } = await params;
  const [deck, allDecks] = await Promise.all([
    decksService.getDeck(user.id, deckId),
    decksService.listDecks(user.id),
  ]);

  const boxes = await leitnerService.getBoxSummary(deck.id);
  const totalWords = boxes.reduce((sum, b) => sum + b.wordCount, 0);
  const reviewQueue = await leitnerService.getReviewQueue(user.id, deck.id, 1000);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <DeckSwitcher decks={allDecks} currentDeckId={deck.id} />
        <div className="flex items-center gap-2">
          <CreateDeckModal />
          <Link href="/leitner/browse" className="text-sm text-brand underline">
            مدیریت لغات
          </Link>
          <Link href="/leitner/tags" className="text-sm text-brand underline">
            شبکه لغات (تگ‌ها)
          </Link>
          <Link href="/leitner/sentences" className="text-sm text-brand underline">
            جملات کاربردی من
          </Link>
          <Link href="/library" className="text-sm text-brand underline">
            کتابخانه
          </Link>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{deck.name}</h1>
          <p className="text-sm text-muted">
            {toPersianDigits(totalWords)} لغت در چرخه فعال
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportFileModal deckId={deck.id} />
          <AddWordWithExamplesModal deckId={deck.id} />
          <AddClozeModal deckId={deck.id} />
          <AddWordModal deckId={deck.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {boxes.map((box) => (
          <BoxCard key={box.boxNumber} box={box} />
        ))}
      </div>

      <div className="mt-8">
        {reviewQueue.length > 0 ? (
          <Link
            href={`/leitner/${deck.id}/review`}
            className="block rounded-2xl bg-brand px-6 py-4 text-center text-lg font-bold text-brand-foreground shadow-sm transition hover:opacity-90"
          >
            شروع مرور روزانه ({toPersianDigits(reviewQueue.length)} لغت آماده)
          </Link>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted">
            {totalWords === 0
              ? "هنوز لغتی اضافه نکردی — از دکمه «افزودن لغت» شروع کن."
              : "امروز چیزی برای مرور نیست 🎉 فردا دوباره سر بزن."}
          </div>
        )}
      </div>
    </div>
  );
}
