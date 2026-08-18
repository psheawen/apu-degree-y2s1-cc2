import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { getLeaderboard } from "@/lib/quiz.functions";

const leaderboardQuery = queryOptions({
  queryKey: ["leaderboard"],
  queryFn: () => getLeaderboard(),
});

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Malay Language Race 2026" },
      {
        name: "description",
        content:
          "Live Malay Language Race 2026 leaderboard: every completed team attempt ranked by score, shared across all devices.",
      },
      { property: "og:title", content: "Leaderboard — Malay Language Race 2026" },
      {
        property: "og:description",
        content: "See which team leads the Malay Language Race 2026 translation and pronunciation challenge.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(leaderboardQuery);
  },
  component: LeaderboardPage,
  errorComponent: () => (
    <div className="p-10 text-center text-muted-foreground">The leaderboard could not be loaded.</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">Not found.</div>,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function LeaderboardPage() {
  const { data } = useSuspenseQuery(leaderboardQuery);

  return (
    <div className="min-h-screen bg-background">
      <EventHeader
        right={
          <Link to="/rules">
            <Button variant="secondary" size="sm">
              Play Now
            </Button>
          </Link>
        }
      />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="font-display text-3xl font-extrabold">Leaderboard</h1>
        <p className="mt-2 text-muted-foreground">All completed attempts, live from the database.</p>

        {data.length === 0 ? (
          <p className="mt-10 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            No team has completed the quiz yet.
          </p>
        ) : (
          <ol className="mt-8 space-y-3">
            {data.map((row, index) => (
              <li
                key={row.id}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-card"
              >
                <span className="flex items-center gap-3">
                  <span className="w-8 text-center text-lg font-bold">
                    {MEDALS[index] ?? index + 1}
                  </span>
                  <span className="font-semibold">{row.teamName}</span>
                </span>
                <span className="font-display text-lg font-bold">
                  {row.correct}/{row.total}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {row.score} pts
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
