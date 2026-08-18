# Quiz Master Hub

IMPORTANT — REAL DATABASE & BACKEND

This must be a real full-stack web application, not a frontend-only prototype.

Connect the application to Supabase as the backend from the beginning.

Use:

Supabase PostgreSQL for application data

Supabase Authentication for organizer accounts

Supabase Storage for pronunciation audio files

Supabase Row Level Security (RLS) to control access

Do NOT use localStorage, static JSON, hard-coded arrays, or mock data as the primary data source.

All important data must persist in Supabase so that multiple organizers and players using different devices can access the same event data.

SUPABASE DATABASE

Create the necessary database tables and relationships.

1. quiz_settings

Store the current event settings:

id

number_of_questions

time_limit_seconds

points_per_question

created_at

updated_at

The organizer can modify these settings from the Organizer Dashboard.

2. questions

Store the shared question bank:

id

question_order

english_text

answer_a

answer_b

answer_c

answer_d

correct_answer

audio_url

created_at

updated_at

Questions must be shared across all teams.

Do NOT create a separate question set for each team.

3. teams

Store participating teams:

id

team_name

created_at

Players do not need to create an account.

When a player enters their team name, create or retrieve the corresponding team.

4. quiz_attempts

Store each team's quiz attempt:

id

team_id

score

total_questions

correct_answers

incorrect_answers

started_at

completed_at

status

Each team should have its own quiz attempt.

Multiple teams must be able to use the same question bank.

5. attempt_answers

Store each answer submitted during an attempt:

id

attempt_id

question_id

selected_answer

is_correct

points_earned

answered_at

This allows the organizer to view detailed results for each team.

SUPABASE STORAGE

Create a Supabase Storage bucket for pronunciation audio.

For example:

pronunciation-audio

When an organizer uploads an audio file:

Upload the file to Supabase Storage.

Save the resulting file URL/path in the corresponding questions.audio_url.

Allow the organizer to preview the audio.

Allow the organizer to replace or delete the audio.

During the player quiz, retrieve and play the stored audio.

Do NOT store the actual audio binary data inside the PostgreSQL question table.

ORGANIZER AUTHENTICATION

Use Supabase Authentication for organizers.

Organizer flow:

Landing Page
→ Organizer
→ Login
→ Organizer Dashboard

Only authenticated organizers can:

View the Organizer Dashboard

Change quiz settings

Create questions

Edit questions

Delete questions

Upload pronunciation audio

View detailed team results

Reset event results

Players must NOT have access to these functions.

PLAYER ACCESS

Players do NOT need an account.

Player flow:

Landing Page
→ Player
→ Game Rules
→ Enter Team Name
→ Start Quiz
→ Quiz
→ Final Score
→ Leaderboard

When the player starts the quiz:

Create a quiz attempt in Supabase.

Retrieve the current active question set from Supabase.

Display the questions in the configured order.

Record each answer in attempt_answers.

Calculate and save the team's score.

Mark the attempt as completed.

Display the leaderboard using completed attempts from Supabase.

SHARED DATA REQUIREMENT

This is extremely important.

All users must access the same Supabase data.

For example:

Organizer A

Creates:

Environment → Persekitaran

and uploads the pronunciation audio.

↓

Organizer B

Logs into the website from another computer.

↓

Organizer B can see:

Environment → Persekitaran → Uploaded Audio

without importing or recreating anything.

Player A

Enters:

Team Alpha

Completes the quiz.

↓

Score:

4 / 5

is saved to Supabase.

Player B

Enters:

Team Cendol

Completes the same quiz.

↓

Score:

5 / 5

is saved to Supabase.

↓

The leaderboard automatically becomes:

RankTeamScore🥇 1Team Cendol5/5🥈 2Team Alpha4/5

The leaderboard must retrieve its data from Supabase rather than browser/local storage.

DATABASE SECURITY

Implement appropriate Supabase Row Level Security (RLS).

Organizers should have permission to manage quiz data.

Players should only be able to:

Start a quiz attempt

Submit answers

View the information necessary to play

View completed leaderboard results

Players must NOT be able to directly modify:

Questions

Correct answers

Quiz settings

Audio files

Existing scores

Do not expose Supabase service-role credentials in frontend code.

Use the Supabase client safely from the application.

PERSISTENCE REQUIREMENT

The application must remain functional if:

The browser is refreshed.

Another computer opens the website.

Another organizer logs in.

Multiple teams play one after another.

Do NOT rely on browser state for important event data.

The database must be the source of truth.

BEFORE FINISHING

Verify the complete database integration.

Test that:

Organizer can log in.

Organizer can create a question.

Question is saved in Supabase.

Organizer can upload pronunciation audio.

Audio is saved in Supabase Storage.

Another organizer can see the same question and audio.

Organizer can change quiz settings.

Player can view the rules.

Player can enter a team name.

Player can start a quiz.

Questions are retrieved from Supabase.

Answers are saved to Supabase.

Scores are saved to Supabase.

Multiple teams can complete the same quiz.

Leaderboard combines results from all completed teams.

Refreshing the page does not delete the event data.

Players cannot access organizer management features.

Organizer can reset scores while keeping the questions and audio.

The final application must be a real database-backed event quiz system, not a mockup or static frontend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37533953-9e92-40dd-bb99-f6fbbf30ea8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
