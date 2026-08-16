import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";
import { DecksService } from "@/lib/modules/decks/service";
import { CategoryVocabList } from "@/components/library/CategoryVocabList";

const libraryService = new LibraryService(prisma);
const decksService = new DecksService(prisma);

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { slug } = await params;
  const [category, decks] = await Promise.all([
    libraryService.getCategoryDetail(slug).catch(() => null),
    decksService.listDecks(user.id),
  ]);

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10 text-center text-muted">
        این دسته‌بندی پیدا نشد.{" "}
        <Link href="/library/categories" className="text-brand underline">
          بازگشت
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-1 text-xs text-muted">
        <Link href="/library/categories" className="text-brand underline">
          گلچین لغات پرکاربرد
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">{category.name}</h1>
      <CategoryVocabList vocabItems={category.vocabItems} decks={decks} />
    </div>
  );
}
