import Link from "next/link";
import { Show } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <Show when="signed-out">
        <h1 className="mb-3 text-3xl font-bold">به جعبه لایتنر خوش اومدی 👋</h1>
        <p className="text-muted">
          یادگیری لغت آیلتس با مرور فاصله‌دار — برای شروع از دکمه ورود/ثبت‌نام
          بالای صفحه استفاده کن.
        </p>
      </Show>
      <Show when="signed-in">
        <h1 className="mb-3 text-3xl font-bold">خوش برگشتی 👋</h1>
        <Link
          href="/leitner"
          className="mt-4 inline-block rounded-xl bg-brand px-6 py-3 font-semibold text-brand-foreground shadow-sm transition hover:opacity-90"
        >
          رفتن به جعبه لایتنر
        </Link>
      </Show>
    </div>
  );
}
