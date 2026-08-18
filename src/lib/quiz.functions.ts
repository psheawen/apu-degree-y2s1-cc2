import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlayerQuestion = {
  id: string;
  question_order: number;
  english_text: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
};

export type QuizSettings = {
  id: string;
  number_of_questions: number;
  time_limit_seconds: number;
  points_per_question: number;
};

export const getQuizConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settings } = await supabaseAdmin
    .from("quiz_settings")
    .select("id, number_of_questions, time_limit_seconds, points_per_question")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const limit = settings?.number_of_questions ?? 5;

  const { data: questions, error } = await supabaseAdmin
    .from("questions")
    .select("id, question_order, english_text, answer_a, answer_b, answer_c, answer_d")
    .order("question_order", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return {
    settings: (settings ?? {
      id: "",
      number_of_questions: 5,
      time_limit_seconds: 30,
      points_per_question: 1,
    }) as QuizSettings,
    questions: (questions ?? []) as PlayerQuestion[],
  };
});

export const startAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ teamName: z.string().min(2).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const teamName = data.teamName.trim();

    const { data: existing } = await supabaseAdmin
      .from("teams")
      .select("id, team_name")
      .ilike("team_name", teamName)
      .maybeSingle();

    let teamId = existing?.id;
    if (!teamId) {
      const { data: created, error } = await supabaseAdmin
        .from("teams")
        .insert({ team_name: teamName })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      teamId = created.id;
    }

    const { data: settings } = await supabaseAdmin
      .from("quiz_settings")
      .select("number_of_questions")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { count } = await supabaseAdmin
      .from("questions")
      .select("id", { count: "exact", head: true });

    const total = Math.min(settings?.number_of_questions ?? 5, count ?? 0);

    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from("quiz_attempts")
      .insert({ team_id: teamId, total_questions: total, status: "in_progress" })
      .select("id")
      .single();
    if (attemptError) throw new Error(attemptError.message);

    return { attemptId: attempt.id, teamId, teamName };
  });

export const submitAnswer = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        attemptId: z.string().uuid(),
        questionId: z.string().uuid(),
        selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: attempt } = await supabaseAdmin
      .from("quiz_attempts")
      .select("id, status")
      .eq("id", data.attemptId)
      .maybeSingle();
    if (!attempt || attempt.status !== "in_progress") {
      throw new Error("This quiz attempt is not active.");
    }

    const { data: question, error } = await supabaseAdmin
      .from("questions")
      .select("id, correct_answer, answer_a, answer_b, answer_c, answer_d, pronunciation, audio_url")
      .eq("id", data.questionId)
      .single();
    if (error) throw new Error(error.message);

    const { data: settings } = await supabaseAdmin
      .from("quiz_settings")
      .select("points_per_question")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const isCorrect = data.selectedAnswer === question.correct_answer;
    const points = isCorrect ? (settings?.points_per_question ?? 1) : 0;

    await supabaseAdmin.from("attempt_answers").upsert(
      {
        attempt_id: data.attemptId,
        question_id: data.questionId,
        selected_answer: data.selectedAnswer,
        is_correct: isCorrect,
        points_earned: points,
      },
      { onConflict: "attempt_id,question_id" },
    );

    const correctText = {
      A: question.answer_a,
      B: question.answer_b,
      C: question.answer_c,
      D: question.answer_d,
    }[question.correct_answer as "A" | "B" | "C" | "D"];

    let audioUrl: string | null = null;
    if (question.audio_url) {
      const { data: signed } = await supabaseAdmin.storage
        .from("pronunciation-audio")
        .createSignedUrl(question.audio_url, 3600);
      audioUrl = signed?.signedUrl ?? null;
    }

    return {
      isCorrect,
      correctAnswer: question.correct_answer as "A" | "B" | "C" | "D",
      correctText,
      pronunciation: question.pronunciation,
      audioUrl,
      pointsEarned: points,
    };
  });

export const completeAttempt = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ attemptId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: answers, error } = await supabaseAdmin
      .from("attempt_answers")
      .select("is_correct, points_earned")
      .eq("attempt_id", data.attemptId);
    if (error) throw new Error(error.message);

    const rows = answers ?? [];
    const correct = rows.filter((r) => r.is_correct).length;
    const score = rows.reduce((sum, r) => sum + r.points_earned, 0);

    const { data: attempt } = await supabaseAdmin
      .from("quiz_attempts")
      .select("total_questions")
      .eq("id", data.attemptId)
      .maybeSingle();

    const total = attempt?.total_questions ?? rows.length;

    const { error: updateError } = await supabaseAdmin
      .from("quiz_attempts")
      .update({
        score,
        correct_answers: correct,
        incorrect_answers: Math.max(total - correct, 0),
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.attemptId);
    if (updateError) throw new Error(updateError.message);

    return { score, correct, total };
  });

export const getLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data, error } = await supabaseAdmin
    .from("quiz_attempts")
    .select("id, score, correct_answers, total_questions, completed_at, teams(team_name)")
    .eq("status", "completed")
    .order("score", { ascending: false })
    .order("completed_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    teamName: row.teams?.team_name ?? "—",
    score: row.score,
    correct: row.correct_answers,
    total: row.total_questions,
    completedAt: row.completed_at,
  }));
});
