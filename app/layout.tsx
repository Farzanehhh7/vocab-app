import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "جعبه لایتنر — یادگیری لغت با مرور فاصله‌دار",
  description: "یادگیری لغت آیلتس با سیستم جعبه لایتنر و شبکه لغات تگ‌دار",
};

async function StreakBadge() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
      <span aria-hidden>🔥</span>
      <span>{user.currentStreak} روز</span>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      {/* dir="rtl" چون رابط کاربری فارسی است — طبق الگوی سایت مرجع در سند معماری */}
      <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
            <span className="font-bold text-lg text-brand">جعبه لایتنر</span>
            <div className="flex items-center gap-3">
              <Show when="signed-in">
                <StreakBadge />
                <UserButton />
              </Show>
              <Show when="signed-out">
                <SignInButton />
                <SignUpButton />
              </Show>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
