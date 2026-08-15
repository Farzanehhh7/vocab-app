import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/modules/users/current-user";
import { ReviewSession } from "@/components/leitner/ReviewSession";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { deckId } = await params;
  return <ReviewSession deckId={deckId} />;
}
