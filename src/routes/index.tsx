import { createFileRoute, Link } from "@tanstack/react-router";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bahasa Race 2026 — Live Translation & Pronunciation Quiz" },
      {
        name: "description",
        content:
          "Join Bahasa Race 2026: teams translate English words into Bahasa Malaysia, hear the correct pronunciation, and climb the live leaderboard.",
      },
      { property: "og:title", content: "Bahasa Race 2026 — Live Translation & Pronunciation Quiz" },
      {
        property: "og:description",
        content: "Teams translate, pronounce, and race up the shared Bahasa Race 2026 leaderboard.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <EventHeader
        right={
          <Link to="/leaderboard">
            <Button variant="secondary" size="sm">
              <Trophy className="mr-1 size-4" /> Papan Pendahulu
            </Button>
          </Link>
        }
      />

      <main className="mx-auto max-w-5xl px-5 py-16">
        <h1 className="text-center font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Terjemah. Sebut. Menang.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          A live Bahasa Malaysia quiz for teams. Organizers manage the shared question bank and
          pronunciation audio; players just enter a team name and race.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-8 shadow-card">
            <Users className="size-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">Pemain / Player</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No account needed. Read the rules, enter your team name, and start the quiz.
            </p>
            <Link to="/rules" className="mt-6 block">
              <Button className="w-full" size="lg">
                Mula sebagai Pemain
              </Button>
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-8 shadow-card">
            <ShieldCheck className="size-10 text-accent" />
            <h2 className="mt-4 font-display text-2xl font-bold">Penganjur / Organizer</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to manage questions, upload pronunciation audio, adjust settings, and review
              every team's results.
            </p>
            <Link to="/auth" className="mt-6 block">
              <Button className="w-full" size="lg" variant="outline">
                Log Masuk Penganjur
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
