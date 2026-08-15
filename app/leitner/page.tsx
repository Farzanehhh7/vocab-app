import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { DecksService } from "@/lib/modules/decks/service";

const decksService = new DecksService(prisma);

/**
 * /leitner صرفاً یک نقطه ورود است — کاربر رو به داشبورد دسته پیش‌فرضش
 * (یا اگه نداشت، دسته اول لیستش) هدایت می‌کند. داشبورد واقعی در
 * /leitner/[deckId]/page.tsx است.
 */
export default async function LeitnerEntryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const deck = await decksService.ensureDefaultDeck(user.id);
  redirect(`/leitner/${deck.id}`);
}
