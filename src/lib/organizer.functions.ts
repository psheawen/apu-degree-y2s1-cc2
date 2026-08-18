import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const questionSchema = z.object({
  id: z.string().uuid().nullable(),
  question_order: z.number().int().min(1),
  english_text: z.string().min(1),
  answer_a: z.string().min(1),
  answer_b: z.string().min(1),
  answer_c: z.string().min(1),
  answer_d: z.string().min(1),
  correct_answer: z.enum(["A", "B", "C", "D"]),
  pronunciation: z.string().nullable(),
  audio_url: z.string().nullable(),
});

export const listQuestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("questions")
      .select("*")
      .order("question_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const saveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => questionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    if (id) {
      const { error } = await context.supabase.from("questions").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: created, error } = await context.supabase
      .from("questions")
      .insert(values)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: question } = await context.supabase
      .from("questions")
      .select("audio_url")
      .eq("id", data.id)
      .maybeSingle();
    if (question?.audio_url) {
      await context.supabase.storage.from("pronunciation-audio").remove([question.audio_url]);
    }
    const { error } = await context.supabase.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setQuestionAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), path: z.string().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: question } = await context.supabase
      .from("questions")
      .select("audio_url")
      .eq("id", data.id)
      .maybeSingle();
    if (question?.audio_url && question.audio_url !== data.path) {
      await context.supabase.storage.from("pronunciation-audio").remove([question.audio_url]);
    }
    const { error } = await context.supabase
      .from("questions")
      .update({ audio_url: data.path })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAudioUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("pronunciation-audio")
      .createSignedUrl(data.path, 3600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_settings")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().nullable(),
        number_of_questions: z.number().int().min(1).max(100),
        time_limit_seconds: z.number().int().min(5).max(600),
        points_per_question: z.number().int().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...values } = data;
    if (id) {
      const { error } = await context.supabase.from("quiz_settings").update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase.from("quiz_settings").insert(values);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_attempts")
      .select(
        "id, score, correct_answers, incorrect_answers, total_questions, status, started_at, completed_at, teams(team_name), attempt_answers(id, selected_answer, is_correct, points_earned, questions(english_text, correct_answer))",
      )
      .order("score", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const resetResults = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error: answersError } = await context.supabase
      .from("attempt_answers")
      .delete()
      .not("id", "is", null);
    if (answersError) throw new Error(answersError.message);

    const { error: attemptsError } = await context.supabase
      .from("quiz_attempts")
      .delete()
      .not("id", "is", null);
    if (attemptsError) throw new Error(attemptsError.message);

    const { error: teamsError } = await context.supabase
      .from("teams")
      .delete()
      .not("id", "is", null);
    if (teamsError) throw new Error(teamsError.message);

    return { ok: true };
  });
