import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Volume2, XCircle } from "lucide-react";
import {
  completeAttempt,
  getQuizConfig,
  startAttempt,
  submitAnswer,
  type PlayerQuestion,
} from "@/lib/quiz.functions";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play the Quiz — Malay Language Race 2026" },
      {
        name: "description",
        content:
          "Enter your team name and play the Malay Language Race 2026 translation and pronunciation quiz. Answers and scores are saved instantly.",
      },
      { property: "og:title", content: "Play the Quiz — Malay Language Race 2026" },
      {
        property: "og:description",
        content: "Enter your team name and race through the Malay Language Race 2026 quiz.",
      },
    ],
  }),
  component: PlayPage,
});

type Letter = "A" | "B" | "C" | "D";
const LETTERS: Letter[] = ["A", "B", "C", "D"];
const LETTER_STYLES: Record<Letter, string> = {
  A: "bg-chart-1 text-primary-foreground",
  B: "bg-destructive text-destructive-foreground",
  C: "bg-gold text-gold-foreground",
  D: "bg-success text-success-foreground",
};

type Feedback = Awaited<ReturnType<typeof submitAnswer>>;

function PlayPage() {
  const navigate = useNavigate();
  const configQuery = useQuery({ queryKey: ["quiz-config"], queryFn: () => getQuizConfig() });
  const start = useServerFn(startAttempt);
  const submit = useServerFn(submitAnswer);
  const finish = useServerFn(completeAttempt);

  const [teamName, setTeamName] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(
    null,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const questions: PlayerQuestion[] = configQuery.data?.questions ?? [];
  const settings = configQuery.data?.settings;
  const current = questions[index];

  const answer = useCallback(
    async (letter: Letter | null) => {
      if (!attemptId || !current || feedback || busy) return;
      setBusy(true);
      setSelected(letter);
      try {
        const res = await submit({
          data: { attemptId, questionId: current.id, selectedAnswer: letter },
        });
        setFeedback(res);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not submit your answer");
      } finally {
        setBusy(false);
      }
    },
    [attemptId, current, feedback, busy, submit],
  );

  useEffect(() => {
    if (!attemptId || feedback || !current || !settings) return;
    setTimeLeft(settings.time_limit_seconds);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          void answer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, index, current?.id, settings?.time_limit_seconds]);

  async function handleStart(event: React.FormEvent) {
    event.preventDefault();
    if (teamName.trim().length < 2) {
      toast.error("Please enter a team name (at least 2 characters).");
      return;
    }
    if (questions.length === 0) {
      toast.error("No questions yet. Please contact the organizer.");
      return;
    }
    setBusy(true);
    try {
      const res = await start({ data: { teamName: teamName.trim() } });
      setAttemptId(res.attemptId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start the quiz");
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (!attemptId) return;
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setSelected(null);
      setFeedback(null);
      return;
    }
    setBusy(true);
    try {
      const res = await finish({ data: { attemptId } });
      setResult(res);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your score");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <EventHeader />
        <main className="mx-auto max-w-2xl px-5 py-16 text-center">
          <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            Final Score
          </p>
          <h1 className="mt-3 font-display text-6xl font-extrabold">
            {result.correct} / {result.total}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pasukan <strong>{teamName}</strong> memperoleh {result.score} pts.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Button size="lg" onClick={() => navigate({ to: "/leaderboard" })}>
              View Leaderboard
            </Button>
            <Link to="/">
              <Button size="lg" variant="outline">
                Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!attemptId) {
    return (
      <div className="min-h-screen bg-background">
        <EventHeader />
        <main className="mx-auto max-w-md px-5 py-16">
          <h1 className="font-display text-3xl font-extrabold">Team Name</h1>
          <p className="mt-2 text-muted-foreground">
            {configQuery.isLoading
              ? "Loading questions..."
              : `${questions.length} questions • ${settings?.time_limit_seconds ?? 30}s per question`}
          </p>
          <form onSubmit={handleStart} className="mt-8 space-y-4">
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Team Cendol"
              maxLength={40}
            />
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              Start Quiz
            </Button>
          </form>
          <Link to="/rules" className="mt-4 block text-center text-sm text-muted-foreground underline">
            Read the rules
          </Link>
        </main>
      </div>
    );
  }

  if (!current) return null;

  const options: Array<[Letter, string]> = [
    ["A", current.answer_a],
    ["B", current.answer_b],
    ["C", current.answer_c],
    ["D", current.answer_d],
  ];

  return (
    <div className="min-h-screen bg-background">
      <EventHeader
        right={
          <span className="rounded-full border border-navy-foreground/30 px-4 py-1.5 text-sm font-bold">
            QUESTION <span className="text-gold">{index + 1}</span> / {questions.length}
          </span>
        }
      />
      <main className="mx-auto max-w-5xl px-5 py-8">
        {!feedback && (
          <div className="mb-6">
            <Progress value={(timeLeft / (settings?.time_limit_seconds ?? 30)) * 100} />
            <p className="mt-2 text-right text-xs text-muted-foreground">{timeLeft}s</p>
          </div>
        )}

        <section className="rounded-2xl border bg-card p-8 shadow-card">
          <p className="mx-auto w-fit rounded-full bg-primary px-4 py-1.5 text-xs font-bold tracking-wider text-primary-foreground uppercase">
            English word / phrase
          </p>
          <h1 className="mt-6 text-center font-display text-5xl font-extrabold tracking-tight">
            {current.english_text}
          </h1>
          <hr className="my-6" />
          <p className="text-center text-muted-foreground">
            Choose the correct Malay translation:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {options.map(([letter, text]) => {
              const isCorrect = feedback && feedback.correctAnswer === letter;
              const isWrongPick = feedback && selected === letter && !feedback.isCorrect;
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={!!feedback || busy}
                  onClick={() => answer(letter)}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
                    isCorrect
                      ? "border-success bg-success-soft"
                      : isWrongPick
                        ? "border-destructive bg-destructive/10"
                        : selected === letter
                          ? "border-ring bg-secondary"
                          : "border-border hover:border-ring hover:bg-secondary"
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full font-bold ${LETTER_STYLES[letter]}`}
                  >
                    {letter}
                  </span>
                  <span className="text-lg font-semibold">{text}</span>
                </button>
              );
            })}
          </div>
        </section>

        {feedback && (
          <section className="mt-6 rounded-2xl border border-success/40 bg-success-soft p-6">
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div className="flex items-center gap-4">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="size-14 text-success" />
                ) : (
                  <XCircle className="size-14 text-destructive" />
                )}
                <div>
                  <p className="text-sm font-bold tracking-wide text-success uppercase">
                    Correct Answer
                  </p>
                  <p className="font-display text-2xl font-bold">{feedback.correctText}</p>
                </div>
              </div>
              <div className="md:border-l md:pl-6">
                <p className="text-sm font-bold tracking-wide text-success uppercase">Pronunciation</p>
                <div className="mt-1 flex items-center gap-3">
                  {feedback.audioUrl && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        onClick={() => audioRef.current?.play()}
                        aria-label="Play pronunciation"
                      >
                        <Volume2 className="size-5" />
                      </Button>
                      <audio ref={audioRef} src={feedback.audioUrl} preload="auto" />
                    </>
                  )}
                  <p className="text-lg">{feedback.pronunciation ?? "—"}</p>
                </div>
              </div>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={next} disabled={busy}>
              {index + 1 < questions.length ? "Next Question" : "Finish & Save Score"}
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
