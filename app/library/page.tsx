import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { LibraryService } from "@/lib/modules/library/service";

const libraryService = new LibraryService(prisma);

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const sources = await libraryService.listSources();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">کتابخانه</h1>
        <div className="flex items-center gap-4">
          <Link href="/library/categories" className="text-sm text-brand underline">
            گلچین لغات پرکاربرد
          </Link>
          <Link href="/leitner" className="text-sm text-brand underline">
            بازگشت به جعبه‌ها
          </Link>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          هنوز منبعی اضافه نشده.
        </div>
      ) : (
        <div className="space-y-6">
          {sources.map((source) => (
            <div key={source.id} className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-1 text-lg font-bold">{source.title}</h2>
              {source.level && <p className="mb-3 text-xs text-muted">سطح: {source.level}</p>}
              <div className="space-y-1.5">
                {source.lessons.map((lesson) => (
                  <Link
                    key={lesson.id}
                    href={`/library/lessons/${lesson.id}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-background"
                  >
                    <span>{lesson.title}</span>
                    {lesson.unitCode && <span className="text-xs text-muted">{lesson.unitCode}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
