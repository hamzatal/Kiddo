# Kiddo v2 — Full AI + Lesson Engine overhaul

This document describes every change landed in this PR branch
(`feat/nccd-audio-wiring`) so you can pull it down, read the
architecture in one place, and start the app.

## TL;DR — how to run

```bash
git pull origin feat/nccd-audio-wiring

composer install
npm install
cp .env.example .env && php artisan key:generate
# add your key:
echo "OPENAI_API_KEY=sk-..." >> .env

php artisan migrate:fresh --seed
npm run build    # or `npm run dev` for hot reload
php artisan serve
```

> **No audio download required.** The app streams every NCCD track on
> demand from `qr.nccd.gov.jo` via the `/api/audio/{code}` proxy
> (302 redirect), and each word can play a specific millisecond
> segment of the track (see "Audio segments" below).

---

## 1. Curriculum — 36 lessons, matching the book exactly

`database/seeders/CurriculumSeeder.php` now mirrors the structure the
project owner supplied for Team Together 1A:

| Unit | Code | Pages | Lessons |
|------|------|-------|---------|
| Welcome: Hello! | U0 | 4–5 | 2 |
| Family and friends | U1 | 6–13 | 8 |
| My school bag | U2 | 14–21 | 8 |
| Our classroom | U3 | 22–29 | 8 |
| My favourite toy | U4 | 30–37 | 8 |
| Learning Club · Days of the week | U5 | 38–39 | 2 |
| **Total** | | | **36** |

Each unit's 8 lessons follow the exact book pattern:

```
Lesson 1  — Vocabulary intro       (Listen, point and say)
Lesson 3  — Language practice      (Listen & circle / number)
Lesson 5  — Story + value          (Find Ann / Lama / the pens / Sue)
Lesson 7  — Listen, match & sing   (song)
Lesson 9  — Phonics set A
Lesson 10 — Phonics set B
Lesson 11 — Project (Make & show)
Picture dictionary                  (Listen and trace)
```

For U4 the phonics lessons switch to **CVC blending** (p34 / p35) per
the book.

Every Word row is linked to its primary audio track (code like `PB6`,
`PB10`, `PB12V` for videos) and carries `segment_start_ms` /
`segment_end_ms` columns that are **NULL by default**, ready for the
teacher to fine-tune later through a small admin UI.

## 2. Audio — streaming, no download, per-word segments

- `app/Http/Controllers/AudioStreamController.php`
  - `GET /api/audio/{code}` — 302 redirects to the NCCD URL.
  - Accepts optional `?s=1800&e=3600` query params (documentation-only
    — actual cutting happens in JS).
- `app/Models/Word.php::audioClip()` returns:
  ```json
  { "src": "/api/audio/PB6", "startMs": 0, "endMs": 1800, "label": "Boy" }
  ```
- `resources/js/learning/utils/playAudio.js` — `playAudioClip(src, { startMs, endMs })`
  plays only the requested range using a `timeupdate` listener.
- `resources/js/learning/components/ui/AudioClipButton.jsx` — a ready-made
  sm/md/lg speaker button.

Result: the repo stays tiny, browser uses HTTP Range requests so only
the bytes for the clicked segment are fetched from NCCD (~20–50KB).

## 3. Lesson engine v2 — 8 modes, one shell

`resources/js/Pages/Lessons/LessonScreen.jsx` is now a generic engine
that picks the right mode based on `lesson.type`:

| Mode | Component | Used by |
|------|-----------|---------|
| `intro` | `modes/IntroMode.jsx` | Lesson 1 of each unit, LC intro |
| `vocab-game` | `modes/VocabGameMode.jsx` | Lesson 3 (language practice), U5 practice |
| `phonics-game` | `modes/VocabGameMode.jsx` with prompt="Listen to the sound" | Lessons 9 and 10 |
| `review` | `modes/VocabGameMode.jsx` with prompt="Review time" | (future) |
| `story` | `modes/StoryMode.jsx` | Lesson 5 of each unit |
| `song` | `modes/VocabGameMode.jsx` with prompt="Listen, match and sing" | Lesson 7 |
| `project` | `modes/ProjectMode.jsx` | Lesson 11 |
| `picture-dict` | `modes/PictureDictMode.jsx` | Last lesson of each unit |

The engine lives in `resources/js/learning/core/lessonEngine.js` and
exposes `resolveMode()`, `modeMeta()`, `computeRoundStars()`.

### Shared UI building blocks

- `OptionCard.jsx` — one card used in all game modes. Handles
  idle/correct/wrong/disabled states with child-friendly feedback.
- `RoundProgress.jsx` — the dots indicator at the top of games.
- `TrackPlayer.jsx` — official NCCD audio player, now supporting
  `segment={{ startMs, endMs }}`.
- `AudioClipButton.jsx` — inline speaker button on every image.

### Sound effects — synthesized, not downloaded

`resources/js/learning/utils/soundEffects.js` generates success/fail
tones on the fly via the Web Audio API. They are deliberately soft
(sine wave, gentle attack, ≤0.15 volume) to match the
"طفولي وهادئ وغير مزعج" requirement. No mp3 files needed.

- `playSuccess()` — 3-note major triad
- `playFail()` — gentle falling 2-note
- `playClick()` — tiny UI tick
- `playReward()` — 5-note "ta-da"

### Reward stage

Built into `LessonScreen.jsx` — shows `Superstar!` / `Great job!` /
`Nice try!` based on % accuracy and plays `playReward()` on arrival.

## 4. AI — 4 endpoints, Fox helper, parent insight, help chat

### Backend

- `app/Services/OpenAiService.php` — thin wrapper around the Chat
  Completions API. When `OPENAI_API_KEY` is missing or a call fails,
  it returns a deterministic kid-safe fallback string instead of
  crashing.
- Three tailored prompts:
  - `foxHelper($word, $unit, $allowedWords, $userPrompt)` — **only** words
    from the child's unit are allowed, 1-2 short sentences max.
  - `parentInsight($stats)` — 3-5 sentences, English, strengths +
    one thing to practice + one home activity.
  - `helpCenterReply($question)` — 2-4 sentences for parents/teachers.
- `app/Http/Controllers/AiController.php` — three endpoints:
  - `POST /ai/lesson-helper` — Fox in LessonScreen
  - `POST /ai/parent-report` — Parent Dashboard button
  - `POST /ai/help-center` — Help Center chat

All three auto-log to `ai_interactions` for audit.

### Frontend AI widgets

| Component | Where it shows |
|-----------|----------------|
| `NavAIBadge.jsx` | Inside the lesson header, shows "Kiddo AI" pill (dimmed when offline) |
| `FoxHelper.jsx` | Bottom-right of `LessonScreen`, 3 quick prompts + free text (limit 120 chars) |
| `HomeAISection.jsx` | Below "Our Learning Units" grid, decorative "Powered by Kiddo AI" panel |
| `ParentAIInsight.jsx` | Near the top of `ProgressScreen` main area, "Generate report" card |
| `HelpAIChat.jsx` | Below FAQ on `HelpCenter`, simple textarea + message history |

The shared Inertia prop `ai.enabled` (set from `HandleInertiaRequests`)
is `true` when `OPENAI_API_KEY` is configured; the UI uses it to show a
subtle "offline" badge when running on the canned-response fallback.

## 5. Files changed / added

### Backend (new)
- `app/Http/Controllers/AudioStreamController.php`
- `app/Services/OpenAiService.php`
- `database/migrations/2026_05_11_120000_add_audio_segments_to_words.php`

### Backend (modified)
- `app/Http/Controllers/LessonController.php` — emits new payload shape
- `app/Http/Controllers/QuizController.php` — scoring via ProgressService
- `app/Http/Controllers/AiController.php` — real OpenAI-powered handlers
- `app/Http/Middleware/HandleInertiaRequests.php` — shares `ai.enabled`
- `app/Models/Word.php` — `audioClip()` helper
- `app/Models/Lesson.php` — `audioTrack()` + `page_number`
- `app/Providers/AppServiceProvider.php` — registers `OpenAiService`
- `app/Services/LessonDeckBuilder.php` — builds intro/deck payload
- `app/Services/ProgressService.php` — stars/XP/unlocks in one place
- `config/services.php` + `.env.example` — `OPENAI_API_KEY` config
- `database/seeders/CurriculumSeeder.php` — 5 units / 36 lessons
- `database/seeders/NccdAudioTrackSeeder.php` — 119 tracks (AB + PB)
- `routes/web.php` — `/api/audio/{code}` + `/lesson/{u}/{l}/result`

### Frontend (new)
- `resources/js/learning/components/ai/FoxHelper.jsx`
- `resources/js/learning/components/ai/NavAIBadge.jsx`
- `resources/js/learning/components/ai/HomeAISection.jsx`
- `resources/js/learning/components/ai/ParentAIInsight.jsx`
- `resources/js/learning/components/ai/HelpAIChat.jsx`
- `resources/js/learning/components/modes/IntroMode.jsx`
- `resources/js/learning/components/modes/VocabGameMode.jsx`
- `resources/js/learning/components/modes/StoryMode.jsx`
- `resources/js/learning/components/modes/ProjectMode.jsx`
- `resources/js/learning/components/modes/PictureDictMode.jsx`
- `resources/js/learning/components/ui/AudioClipButton.jsx`
- `resources/js/learning/components/ui/OptionCard.jsx`
- `resources/js/learning/components/ui/RoundProgress.jsx`
- `resources/js/learning/core/lessonEngine.js`
- `resources/js/learning/utils/soundEffects.js`

### Frontend (modified)
- `resources/js/Pages/Lessons/LessonScreen.jsx` — new engine
- `resources/js/Pages/Quiz/QuizScreen.jsx` — real correct/wrong count
- `resources/js/Pages/Home/HomeScreen.jsx` — `+ HomeAISection`
- `resources/js/Pages/Help/HelpCenter.jsx` — `+ HelpAIChat`
- `resources/js/Pages/Parent/ProgressScreen.jsx` — `+ ParentAIInsight`
- `resources/js/learning/components/ui/TrackPlayer.jsx` — segment support
- `resources/js/learning/utils/playAudio.js` — clip playback helper

## 6. Filling in audio segments later (optional, recommended)

Every Word row has nullable `segment_start_ms` / `segment_end_ms`
columns. When both are null the track plays in full. To tune them
without editing code, you can build a one-page admin tool that:

1. Lists Words grouped by unit.
2. For each row, embeds an `<audio>` with the NCCD URL.
3. Lets the teacher play, set start/end (two buttons: "set start now"
   / "set end now"), and save via `POST /admin/words/{id}/segments`
   (you'd add this route).

Until then, the app works fine — tapping a card just plays the full
~2-minute clip; once segments are set it plays only the relevant 1.5s.

## 7. What's intentionally left out of this PR

- A speech-to-text "Say it out loud" feature (idea 3 in your spec) —
  deferred because it requires microphone permissions + a second API.
- Downloadable audio caching — removed in this revision per your
  request to keep the repo lightweight.
- Separate images for every phonics-only word — the phonics Word rows
  re-use the vocab image for now. Easy to extend later.
