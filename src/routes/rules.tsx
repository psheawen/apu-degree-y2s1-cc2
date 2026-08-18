import { createFileRoute, Link } from "@tanstack/react-router";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Game Rules — Malay Language Race 2026" },
      {
        name: "description",
        content:
          "Game rules for Malay Language Race 2026: how scoring, the timer, and pronunciation playback work before your team starts the quiz.",
      },
      { property: "og:title", content: "Game Rules — Malay Language Race 2026" },
      {
        property: "og:description",
        content: "Read the Malay Language Race 2026 rules before your team starts the quiz.",
      },
    ],
  }),
  component: RulesPage,
});

const RULES = [
  "Setiap soalan memaparkan satu perkataan atau frasa Bahasa Inggeris.",
  "Pilih terjemahan Bahasa Malaysia yang correct daripada empat pilihan (A–D).",
  "Selepas per question, jawapan dan sebutan yang correct akan dipaparkan.",
  "Setiap soalan mempunyai had masa. Jika masa tamat, soalan dikira tidak dijawab.",
  "Markah pasukan disimpan secara automatik dan dipaparkan pada papan pendahulu.",
];

function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <EventHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold">Game Rules</h1>
        <p className="mt-2 text-muted-foreground">Game Rules</p>

        <ul className="mt-8 space-y-4">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-3 rounded-xl border bg-card p-4 shadow-card">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <span className="text-sm">{rule}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/play">
            <Button size="lg">Next: Team Name</Button>
          </Link>
          <Link to="/">
            <Button size="lg" variant="outline">
              Back
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
