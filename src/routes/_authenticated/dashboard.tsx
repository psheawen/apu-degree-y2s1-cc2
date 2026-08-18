import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { EventHeader } from "@/components/EventHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Pencil, Play, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteQuestion,
  getAudioUrl,
  getResults,
  getSettings,
  listQuestions,
  resetResults,
  saveQuestion,
  saveSettings,
  setQuestionAudio,
} from "@/lib/organizer.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Papan Penganjur — Bahasa Race 2026" },
      {
        name: "description",
        content:
          "Organizer dashboard for Bahasa Race 2026: manage questions, pronunciation audio, quiz settings, and team results.",
      },
      { property: "og:title", content: "Papan Penganjur — Bahasa Race 2026" },
      {
        property: "og:description",
        content: "Manage the shared Bahasa Race 2026 question bank and results.",
      },
    ],
  }),
  component: Dashboard,
});

type Letter = "A" | "B" | "C" | "D";

const emptyForm = {
  id: null as string | null,
  question_order: 1,
  english_text: "",
  answer_a: "",
  answer_b: "",
  answer_c: "",
  answer_d: "",
  correct_answer: "A" as Letter,
  pronunciation: "",
};

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchQuestions = useServerFn(listQuestions);
  const fetchSettings = useServerFn(getSettings);
  const fetchResults = useServerFn(getResults);
  const saveQuestionFn = useServerFn(saveQuestion);
  const deleteQuestionFn = useServerFn(deleteQuestion);
  const setAudioFn = useServerFn(setQuestionAudio);
  const signAudioFn = useServerFn(getAudioUrl);
  const saveSettingsFn = useServerFn(saveSettings);
  const resetFn = useServerFn(resetResults);

  const questionsQuery = useQuery({ queryKey: ["org", "questions"], queryFn: () => fetchQuestions() });
  const settingsQuery = useQuery({ queryKey: ["org", "settings"], queryFn: () => fetchSettings() });
  const resultsQuery = useQuery({ queryKey: ["org", "results"], queryFn: () => fetchResults() });

  const [form, setForm] = useState(emptyForm);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveQuestionFn({
        data: {
          ...form,
          question_order: Number(form.question_order),
          pronunciation: form.pronunciation || null,
          audio_url: null,
        },
      }),
    onSuccess: () => {
      toast.success("Soalan disimpan.");
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["org", "questions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSaveQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (form.id) {
      const existing = questionsQuery.data?.find((q) => q.id === form.id);
      await saveQuestionFn({
        data: {
          ...form,
          question_order: Number(form.question_order),
          pronunciation: form.pronunciation || null,
          audio_url: existing?.audio_url ?? null,
        },
      })
        .then(() => {
          toast.success("Soalan dikemas kini.");
          setForm(emptyForm);
          queryClient.invalidateQueries({ queryKey: ["org", "questions"] });
        })
        .catch((error: Error) => toast.error(error.message));
      return;
    }
    saveMutation.mutate();
  }

  async function handleUpload(questionId: string, file: File) {
    setUploadingId(questionId);
    try {
      const path = `${questionId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage
        .from("pronunciation-audio")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      await setAudioFn({ data: { id: questionId, path } });
      toast.success("Audio dimuat naik.");
      queryClient.invalidateQueries({ queryKey: ["org", "questions"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Muat naik gagal");
    } finally {
      setUploadingId(null);
    }
  }

  async function previewAudio(path: string) {
    try {
      const { url } = await signAudioFn({ data: { path } });
      new Audio(url).play();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Audio tidak dapat dimainkan");
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const settings = settingsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <EventHeader
        right={
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-1 size-4" /> Log Keluar
          </Button>
        }
      />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl font-extrabold">Papan Penganjur</h1>
        <p className="mt-2 text-muted-foreground">
          Semua data dikongsi antara penganjur dan pemain melalui pangkalan data.
        </p>

        <Tabs defaultValue="questions" className="mt-8">
          <TabsList>
            <TabsTrigger value="questions">Soalan</TabsTrigger>
            <TabsTrigger value="settings">Tetapan</TabsTrigger>
            <TabsTrigger value="results">Keputusan</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-6 space-y-8">
            <form onSubmit={handleSaveQuestion} className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="font-display text-xl font-bold">
                {form.id ? "Kemas Kini Soalan" : "Soalan Baharu"}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Perkataan Inggeris</Label>
                  <Input
                    required
                    value={form.english_text}
                    onChange={(e) => setForm({ ...form, english_text: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Susunan</Label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={form.question_order}
                    onChange={(e) => setForm({ ...form, question_order: Number(e.target.value) })}
                  />
                </div>
                {(["a", "b", "c", "d"] as const).map((key) => (
                  <div className="space-y-2" key={key}>
                    <Label>Jawapan {key.toUpperCase()}</Label>
                    <Input
                      required
                      value={form[`answer_${key}`]}
                      onChange={(e) => setForm({ ...form, [`answer_${key}`]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Jawapan Betul</Label>
                  <Select
                    value={form.correct_answer}
                    onValueChange={(value) => setForm({ ...form, correct_answer: value as Letter })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["A", "B", "C", "D"] as Letter[]).map((letter) => (
                        <SelectItem key={letter} value={letter}>
                          {letter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sebutan (contoh: /per.se.ki.ta.ran/)</Label>
                  <Input
                    value={form.pronunciation}
                    onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Button type="submit">{form.id ? "Simpan Perubahan" : "Tambah Soalan"}</Button>
                {form.id && (
                  <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                    Batal
                  </Button>
                )}
              </div>
            </form>

            <div className="space-y-3">
              {(questionsQuery.data ?? []).map((question) => (
                <div
                  key={question.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-card"
                >
                  <div>
                    <p className="font-display text-lg font-bold">
                      {question.question_order}. {question.english_text}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Betul: {question.correct_answer} •{" "}
                      {question.pronunciation ?? "tiada sebutan"} •{" "}
                      {question.audio_url ? "audio tersedia" : "tiada audio"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {question.audio_url && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => previewAudio(question.audio_url!)}
                      >
                        <Play className="mr-1 size-4" /> Dengar
                      </Button>
                    )}
                    <label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-1.5 text-sm">
                      <Upload className="mr-1 size-4" />
                      {uploadingId === question.id
                        ? "Memuat naik..."
                        : question.audio_url
                          ? "Ganti audio"
                          : "Muat naik audio"}
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUpload(question.id, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {question.audio_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await setAudioFn({ data: { id: question.id, path: null } });
                          toast.success("Audio dipadam.");
                          queryClient.invalidateQueries({ queryKey: ["org", "questions"] });
                        }}
                      >
                        Padam audio
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: question.id,
                          question_order: question.question_order,
                          english_text: question.english_text,
                          answer_a: question.answer_a,
                          answer_b: question.answer_b,
                          answer_c: question.answer_c,
                          answer_d: question.answer_d,
                          correct_answer: question.correct_answer as Letter,
                          pronunciation: question.pronunciation ?? "",
                        })
                      }
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        await deleteQuestionFn({ data: { id: question.id } });
                        toast.success("Soalan dipadam.");
                        queryClient.invalidateQueries({ queryKey: ["org", "questions"] });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <form
              className="max-w-md space-y-4 rounded-2xl border bg-card p-6 shadow-card"
              onSubmit={async (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                try {
                  await saveSettingsFn({
                    data: {
                      id: settings?.id ?? null,
                      number_of_questions: Number(data.get("number_of_questions")),
                      time_limit_seconds: Number(data.get("time_limit_seconds")),
                      points_per_question: Number(data.get("points_per_question")),
                    },
                  });
                  toast.success("Tetapan disimpan.");
                  queryClient.invalidateQueries({ queryKey: ["org", "settings"] });
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Gagal menyimpan");
                }
              }}
            >
              <h2 className="font-display text-xl font-bold">Tetapan Kuiz</h2>
              <div className="space-y-2">
                <Label>Bilangan soalan</Label>
                <Input
                  name="number_of_questions"
                  type="number"
                  min={1}
                  defaultValue={settings?.number_of_questions ?? 5}
                  key={`n-${settings?.number_of_questions}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Had masa (saat)</Label>
                <Input
                  name="time_limit_seconds"
                  type="number"
                  min={5}
                  defaultValue={settings?.time_limit_seconds ?? 30}
                  key={`t-${settings?.time_limit_seconds}`}
                />
              </div>
              <div className="space-y-2">
                <Label>Mata setiap soalan</Label>
                <Input
                  name="points_per_question"
                  type="number"
                  min={1}
                  defaultValue={settings?.points_per_question ?? 1}
                  key={`p-${settings?.points_per_question}`}
                />
              </div>
              <Button type="submit">Simpan Tetapan</Button>
            </form>
          </TabsContent>

          <TabsContent value="results" className="mt-6 space-y-6">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!confirm("Padam semua markah dan pasukan? Soalan dan audio kekal.")) return;
                await resetFn({});
                toast.success("Keputusan direset.");
                queryClient.invalidateQueries({ queryKey: ["org", "results"] });
              }}
            >
              Reset Keputusan
            </Button>

            <div className="space-y-3">
              {(resultsQuery.data ?? []).map((attempt) => (
                <details key={attempt.id} className="rounded-xl border bg-card p-4 shadow-card">
                  <summary className="cursor-pointer font-semibold">
                    {attempt.teams?.team_name ?? "—"} — {attempt.correct_answers}/
                    {attempt.total_questions} ({attempt.score} mata) • {attempt.status}
                  </summary>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {attempt.attempt_answers.map((answer) => (
                      <li key={answer.id}>
                        {answer.questions?.english_text}: dipilih {answer.selected_answer ?? "—"},
                        betul {answer.questions?.correct_answer} —{" "}
                        {answer.is_correct ? "✅" : "❌"} ({answer.points_earned} mata)
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              {(resultsQuery.data ?? []).length === 0 && (
                <p className="text-muted-foreground">Belum ada percubaan.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
