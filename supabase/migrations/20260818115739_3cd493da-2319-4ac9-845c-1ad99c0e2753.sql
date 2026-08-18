ALTER TABLE public.quiz_settings
ADD COLUMN IF NOT EXISTS rules text[] NOT NULL DEFAULT ARRAY[
  'Each question shows one English word or phrase.',
  'Choose the correct Malay translation from the four options (A-D).',
  'After each question, the correct answer and its pronunciation are shown.',
  'Every question has a time limit. If time runs out, the question counts as unanswered.',
  'Your team score is saved automatically and shown on the leaderboard.'
]::text[];