import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { TagsService } from "@/lib/modules/tags/service";
import { toPersianDigits } from "@/components/leitner/BoxCard";

const tagsService = new TagsService(prisma);

export default async function TagsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const tags = await tagsService.listTagsWithCounts(user.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">شبکه لغات — بر اساس تگ</h1>
        <Link href="/leitner" className="text-sm text-brand underline">
          بازگشت به جعبه‌ها
        </Link>
      </div>

      {tags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
          هنوز تگی نساختی. موقع افزودن لغت جدید، تو فیلد «تگ‌ها» یکی اضافه کن —
          مثلاً <code className="rounded bg-background px-1">environment</code> یا{" "}
          <code className="rounded bg-background px-1">phrasal-verb</code>.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/leitner/tags/${encodeURIComponent(tag.name)}`}
              className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-sm transition hover:border-brand hover:text-brand"
            >
              <span className="font-medium">#{tag.name}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                {toPersianDigits(tag.noteCount)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
