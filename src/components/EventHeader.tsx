import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Flower2 } from "lucide-react";

export function EventHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="bg-hero text-navy-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <Flower2 className="size-9 text-destructive" strokeWidth={2.2} />
          <span>
            <span className="block font-display text-2xl leading-none font-extrabold tracking-tight">
              MALAY LANGUAGE <span className="text-gold">RACE 2026</span>
            </span>
            <span className="text-xs text-navy-foreground/70">Translate &amp; Pronounce Challenge</span>
          </span>
        </Link>
        {right}
      </div>
    </header>
  );
}
