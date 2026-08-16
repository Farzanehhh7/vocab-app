import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";

const libraryService = new LibraryService(prisma);

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const categories = await libraryService.listCategories();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">گلچین لغات پرکاربرد</h1>
        <Link href="/library" className="text-sm text-brand underline">
          کتابخانه
        </Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        لغات از هر درس/کتابی که باشن، بر اساس موضوع کنار هم — نه لزوماً از یک درس.
      </p>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          هنوز دسته‌بندی‌ای اضافه نشده.
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/library/categories/${c.slug}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-background"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted">{c.vocabCount} لغت</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
