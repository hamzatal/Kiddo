# Kiddo — English Learning Adventure 🦊

> A curriculum-aligned, audio-first English learning platform for
> first-grade students (ages 6–7). Built with Laravel 11 + Inertia +
> React 19 + Tailwind 3.

Kiddo turns the Jordanian Ministry of Education **Team Together 1A**
curriculum into a playful adventure: 5 themed units, ~36 lessons, 16
distinct mini-game styles, and a friendly Fox helper powered by
OpenAI. Children learn through tap, drag-and-drop, and listen — no
microphone, no camera, no reading required.

---

## ✨ Highlights

- **Curriculum-aligned**: 5 units (Welcome, Family, School Bag,
  Classroom, Toys) with seeded vocabulary mirroring the Pearson /
  NCCD audio tracks.
- **Audio-first**: a 3-tier audio fallback chain (NCCD →
  OpenAI TTS → browser SpeechSynthesis) so a missing track never
  breaks the lesson.
- **AI helpers** (optional, free without a key):
    - `Fox helper` — child-facing 1-2 sentence reassurance.
    - `Parent insight` — 3-5 sentence weekly progress report.
    - `Help Center chat` — parent support assistant.
- **Sequential unlock chain**: Unit N is locked until Unit N-1 is
  fully completed; star + XP totals can't be farmed by hand-crafted
  POSTs.
- **Strict viewport fit**: every play screen renders inside one
  viewport (`100dvh`) so children never scroll mid-lesson on a
  720p tablet.

---

## 🧱 Stack

| Layer        | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| PHP          | 8.2 / 8.3 / 8.4                                                |
| Framework    | Laravel 11                                                     |
| SPA bridge   | Inertia 3                                                      |
| UI runtime   | React 19 + framer-motion                                       |
| Styling      | Tailwind CSS 3 (custom kiddo palette + dark-mode classes)      |
| Build        | Vite 5                                                         |
| Icons        | lucide-react                                                   |
| Forms        | react-hook-form + zod                                          |
| Toasts       | sonner                                                         |
| Tests (FE)   | Vitest + @testing-library/react + jsdom                        |
| Tests (BE)   | PHPUnit 10                                                     |
| Lint / fmt   | ESLint 9 (flat config) + Prettier + Pint                       |
| AI           | OpenAI Chat Completions + Whisper + TTS                        |

---

## 🚀 Local development

```bash
# 1. Install dependencies
composer install
npm ci

# 2. Bootstrap the env + sqlite database
cp .env.example .env
php artisan key:generate
mkdir -p database
touch database/database.sqlite
php artisan migrate --seed

# 3. Start the dev server (Vite + Laravel) in two terminals
php artisan serve
npm run dev
```

Visit <http://localhost:8000>.

The default seeder creates an admin (`admin@kiddo.app` / `password`)
and a curriculum dataset (5 units, 36 lessons, 200+ words). To skip
the heavy seed, run `php artisan migrate` without `--seed`.

### Scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                      |
| `npm run build`        | Production build                              |
| `npm run lint`         | ESLint (errors + a11y violations)             |
| `npm run lint:fix`     | ESLint --fix                                  |
| `npm run format`       | Prettier --write                              |
| `npm run format:check` | Prettier --check (CI uses this)               |
| `npm run test`         | Vitest single run                             |
| `npm run test:watch`   | Vitest watch mode                             |
| `npm run test:coverage`| Coverage report (V8)                          |
| `composer lint`        | Laravel Pint --test                           |
| `composer lint:fix`    | Laravel Pint                                  |
| `composer test`        | PHPUnit                                       |

---

## 🔑 Configuration

The most important `.env` keys (see `.env.example` for the full set):

```dotenv
# Brand
APP_NAME=Kiddo
APP_VERSION=2.0.0

# Sessions
SESSION_DRIVER=database
SESSION_SAME_SITE=lax

# OpenAI — leave blank for safe canned replies
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_TTS_VOICE=nova
OPENAI_TTS_INSTRUCTIONS="Speak like a warm kindergarten teacher…"

# Feature flags
KIDDO_FEATURE_FOX_HELPER=true
KIDDO_FEATURE_PARENT_AI_REPORT=true
KIDDO_FEATURE_HELP_CENTER_AI=true
```

---

## 🛡️ Security model

- **Rate limiting** on all auth + AI endpoints
  (5/min register, 8/min login, 20/min AI helpers, 30/min TTS).
- **CSRF tokens** auto-attached by `resources/js/bootstrap.js`
  (reads `<meta name="csrf-token">` and re-reads on every request
  to survive token rotation).
- **Authorization**: `LessonController::submitResult` verifies the
  lesson belongs to the URL unit, that unit is unlocked for the
  user, and lesson_number ≤ current_lesson — so stars/XP can't be
  farmed.
- **PII boundary**: `OpenAiService::parentInsight` never receives
  the child's name. The controller anonymises the payload, the AI
  refers to "the child", then we re-stitch the real name on the
  response server-side.
- **Password rules**: NIST-aligned (min 8 chars, letters + digits,
  password_confirmation). Parental consent checkbox on the
  registration form is required by the validator.
- **HTTPS forced** in production / staging via
  `URL::forceScheme('https')` in `AppServiceProvider`.

---

## 🗂️ Repo layout

```
app/
  Console/Commands/    # AutoSegmentCommand, GenerateTtsCommand, ...
  Http/
    Controllers/       # 14 controllers (Home, Map, Lesson, Quiz, AI, Admin, …)
    Middleware/        # HandleInertiaRequests, EnsureAdmin
  Models/              # User, Unit, Lesson, Word, AudioTrack, …
  Providers/           # AppServiceProvider
  Services/            # ProgressService, OpenAiService, UnitAccessService, …

resources/
  css/                 # Tailwind entry + design tokens
  js/
    app.jsx            # Root: ErrorBoundary + Toaster + Inertia
    bootstrap.js       # axios + CSRF interceptor
    Layouts/           # AppLayout (nav + footer + mascot)
    Pages/
      Home/            # HomeScreen.jsx
      Map/             # MapScreen.jsx
      Lessons/         # LessonScreen.jsx
      Quiz/            # QuizScreen.jsx
      Arena/           # ArenaScreen.jsx
      Parent/          # ProgressScreen.jsx (dashboard)
      Help/            # HelpCenter.jsx
      Admin/           # Dashboard, Lessons, Tracks, Units, Words
      Auth/            # Login.jsx, Register.jsx
      AboutScreen.jsx
    learning/
      core/            # lessonEngine, audioSystem, stageSystem, …
      utils/           # playAudio, soundEffects, confetti, localProgress
      components/
        ui/            # JuicyButton, PolicyModal, Logo, PageHead, …
        modes/         # 16 game-mode components (intro, vocab-game, …)
        ai/            # FoxHelper, MascotBuddy, ParentAIInsight, …
        admin/         # admin-panel widgets
    lib/               # cn, usePageProps, toast helpers

routes/web.php         # web routes (auth, lessons, quiz, arena, AI, admin)

tests/
  js/                  # Vitest setup + smoke tests
  Feature/             # Laravel feature tests
  Unit/                # Laravel unit tests
```

---

## 🧪 Testing

Frontend (Vitest + React Testing Library):

```bash
npm run test            # single run, used by CI
npm run test:watch
npm run test:coverage   # opens an HTML coverage report
```

Backend (PHPUnit):

```bash
composer test
composer test:coverage
```

CI runs the full matrix on **PHP 8.2 / 8.3 / 8.4** and
**Node 20 / 22** — see `.github/workflows/ci.yml`.

---

## 🤝 Contributing

1. Fork → create a branch off `main`.
2. Run `npm run format` + `composer lint:fix` before committing.
3. Open a PR. CI must be green (lint + format + tests + build) for
   merge.

We follow conventional-style commit subjects:
`type(scope): subject` — e.g.
`fix(security): rate limit /login` or
`feat(arena): add streak counter`.

---

## 📜 License

MIT. The Pearson / NCCD audio tracks streamed via
`/api/audio/{code}` are licensed separately and remain the property
of their respective publishers.
