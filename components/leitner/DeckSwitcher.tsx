import Link from "next/link";

interface DeckSwitcherProps {
  decks: { id: string; name: string }[];
  currentDeckId: string;
}

export function DeckSwitcher({ decks, currentDeckId }: DeckSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {decks.map((deck) => (
        <Link
          key={deck.id}
          href={`/leitner/${deck.id}`}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            deck.id === currentDeckId
              ? "bg-brand text-brand-foreground"
              : "border border-border text-muted hover:border-brand hover:text-brand"
          }`}
        >
          {deck.name}
        </Link>
      ))}
    </div>
  );
}
