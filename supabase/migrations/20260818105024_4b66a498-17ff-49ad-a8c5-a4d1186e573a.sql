
CREATE TYPE public.app_role AS ENUM ('organizer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_organizer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'organizer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_organizer
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_organizer();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.quiz_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number_of_questions integer NOT NULL DEFAULT 5,
  time_limit_seconds integer NOT NULL DEFAULT 30,
  points_per_question integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_settings TO authenticated;
GRANT ALL ON public.quiz_settings TO service_role;
ALTER TABLE public.quiz_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers manage settings" ON public.quiz_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'organizer')) WITH CHECK (public.has_role(auth.uid(), 'organizer'));
CREATE TRIGGER quiz_settings_updated BEFORE UPDATE ON public.quiz_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_order integer NOT NULL DEFAULT 1,
  english_text text NOT NULL,
  answer_a text NOT NULL,
  answer_b text NOT NULL,
  answer_c text NOT NULL,
  answer_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  pronunciation text,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers manage questions" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'organizer')) WITH CHECK (public.has_role(auth.uid(), 'organizer'));
CREATE TRIGGER questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers view teams" ON public.teams FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers delete teams" ON public.teams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'organizer'));

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  incorrect_answers integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed'))
);
GRANT SELECT, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers view attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers delete attempts" ON public.quiz_attempts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'organizer'));

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer text CHECK (selected_answer IN ('A','B','C','D')),
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT, DELETE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers view attempt answers" ON public.attempt_answers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'organizer'));
CREATE POLICY "Organizers delete attempt answers" ON public.attempt_answers FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'organizer'));

INSERT INTO public.quiz_settings (number_of_questions, time_limit_seconds, points_per_question) VALUES (5, 30, 1);

INSERT INTO public.questions (question_order, english_text, answer_a, answer_b, answer_c, answer_d, correct_answer, pronunciation) VALUES
 (1, 'Environment', 'Persekitaran', 'Pengalaman', 'Kejayaan', 'Perhubungan', 'A', '/per.se.ki.ta.ran/'),
 (2, 'Knowledge', 'Kebebasan', 'Pengetahuan', 'Kesihatan', 'Perniagaan', 'B', '/pe.nge.ta.hu.an/'),
 (3, 'Friendship', 'Persaudaraan', 'Perbelanjaan', 'Persahabatan', 'Pergerakan', 'C', '/per.sa.ha.ba.tan/'),
 (4, 'Development', 'Pembaziran', 'Penyelesaian', 'Pengeluaran', 'Pembangunan', 'D', '/pem.ba.ngu.nan/'),
 (5, 'Success', 'Kejayaan', 'Kegagalan', 'Keberanian', 'Kesabaran', 'A', '/ke.ja.ya.an/');
