# Troubleshooting

Quick fixes for the most common Kiddo dev-environment failures.

## Browser shows: "Cannot read properties of null (reading 'createProvider')"

**Stack trace points at `Head.ts:14:47`**, which is the line inside
`@inertiajs/react`:

```ts
const provider = useMemo(() => headManager.createProvider(), [headManager])
```

`headManager` comes from `useContext(HeadContext)`. The `<App>` Inertia
hands you in `setup({ App, ... })` is the component that mounts
`<HeadContext.Provider value={headManager}>`. If `<Head />` is rendered
**outside** `<App>` it falls back to the context's default value of
`null`, and `null.createProvider()` throws.

**Permanent fix (already applied on `main`):** `resources/js/app.jsx`
no longer renders a stand-alone `<Head title="" />` next to `<App>`.
The default page title is configured via the `title:` callback on
`createInertiaApp(...)`, which Inertia honours without needing a root
`<Head>` element. Pages that want to override the title still render
their own `<Head>` from inside the page component, where the context
is available.

If you want to add another root-level `<Head>` in the future, render
it inside `<App>`, never as a sibling.

## `npm ci` fails with "Missing: <package> from lock file"

The `package-lock.json` shipped with the repo was deliberately removed
when the lockfile got out of sync with `package.json` (~95% of declared
deps were missing from it).

**Fix:** run `npm install` (NOT `npm ci`) to regenerate the lockfile,
then commit the regenerated lockfile so other devs and CI can use
`npm ci` again:

```bash
npm install --no-audit --no-fund
git add package-lock.json
git commit -m "chore(deps): regenerate package-lock.json"
```

## `Remove-Item ... Access to the path 'esbuild.exe' is denied` on Windows

The esbuild and Rollup native binaries are held open by:
- a still-running `npm run dev` / Vite process,
- the VS Code TypeScript server,
- Windows Defender mid-scan.

**Fix:** use the helper script which kills the holders and retries:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\clean-reset.ps1
```

If that still fails, close VS Code completely and re-run the script.

## Browser shows: "SQLSTATE[42S02]: ... Table 'kiddo.cache' doesn't exist"

The project's `config/cache.php` defaults to the `database` driver and
`StreakService::summary()` / `DailyQuestService::for()` use
`Cache::remember(...)`. The migrations for the `cache`, `cache_locks`,
`jobs`, `job_batches`, and `failed_jobs` tables ship with the repo;
just run them:

```
php artisan migrate
```

If you'd rather skip the database driver entirely, change `.env`:

```
CACHE_STORE=file
QUEUE_CONNECTION=sync
```

…then `php artisan config:clear`.

## Never run `npm audit fix --force`

`--force` allows npm to install **major-version upgrades** that don't
satisfy peer-dependency constraints. On 2026-05-19 it tried to push
Vite to a non-existent `8.0.13` and Vitest to `4.1.6`, breaking the
build. Use the targeted `npm audit fix` (without `--force`) and review
each change manually.


## Lesson stuck on first screen — only the audio button works

**Symptom (reported May 2026):** A brand-new learner lands on the
first lesson (Welcome → Lesson 1, _Greetings & characters_, intro
mode), sees the big green play button at the top, taps it, the
audio plays — and **nothing else on the page does anything**. The
"Continue →" button stays grey, the word cards don't react, and
the kid can't reach the colours lesson, the quiz, or anything else.
Same complaint surfaces on Lesson 2 (Colours & Numbers, vocab-game
with `Red` as the first prompt) and on the unit Quiz.

**Root cause:** progression gating in the front-end mode components.

| Mode | Old gating |
|---|---|
| `IntroMode` | `disabled={!allTapped}` — Continue greyed-out until every card was tapped. |
| `StoryMode` | `disabled={!allMet}` — "I listened" greyed-out until every character was tapped. |
| `PictureDictMode` | `disabled={!allSeen}` — Finish greyed-out until every dictionary tile was tapped. |
| `SequenceBuildMode` | `disabled={placed.length !== expectedLen}` — Done greyed-out until the kid built the full sentence. |
| `OptionCard` (idle) | `ring-dashed` (no-op Tailwind class) so the card had no visible "I'm a button" affordance. |
| `LessonScreen` skip pill | `hidden sm:inline` on the label, so on phones it was just a tiny ⏭️ emoji in the corner — kids didn't recognise it as a recovery path. |
| `QuizScreen` | No skip control at all. A child who couldn't answer Q1 had to use the browser back button. |

The cards _were_ technically tappable, but the SVG-fallback art and
the small static 🔊 chip in the corner read as decoration to first-
graders. With the only obviously-tappable element being the lesson
audio TrackPlayer, the kid would tap it, hear the sentence, and have
no idea what to do next.

**Permanent fix (already applied on `main`):**

1. `AppHeader` gained an `onSkip` + `skipLabel` prop. Lesson, Quiz
   and Arena screens render a prominent **"Next ➡ / Quiz 🏆 / End 🏁
   / Finish 🏁"** button on the right side of the header that always
   shows its label (no `hidden sm:inline`).
2. `IntroMode`, `StoryMode`, `PictureDictMode`, `SequenceBuildMode`
   all dropped the disabled-by-default Continue / Done gating.
   Tapping cards / characters / tiles still rewards a higher star
   score (3 vs 1) but **never blocks progression**.
3. `IntroMode` cards now pulse a soft purple ring and bounce the 🔊
   chip on idle so kids unambiguously read them as tap targets.
4. `OptionCard` idle state replaced the no-op `ring-dashed` with a
   solid purple ring + global `.animate-optionPulse` glow so every
   game card visibly invites a tap, even on the SVG fallback.
5. `QuizScreen` gained a `skipQuiz` handler + a floating "End 🏁"
   pill that submits whatever score the kid has earned.
6. The floating skip pill on every screen is now a proper labelled
   gradient button instead of a ghost pill with an emoji-only label.

**Smoke test after pulling the fix:**

```
1. Sign in as a fresh user.
2. /map → tap Welcome.
3. Should land on /lesson/{welcomeId} (Lesson 1, Greetings).
4. Confirm: header shows a green "Next ➡" button.
5. Confirm: bottom-right shows a labelled "Next" pill.
6. Confirm: cards have a soft purple pulsing ring and a 🔊 badge
   that bounces gently.
7. Tap "Continue →" without tapping any card. Should advance to
   Lesson 2 (Colours & Numbers) with 1 star recorded.
8. On Lesson 2, tap "Next ➡" in the header. Should advance to
   Lesson 3 (Circle the colour!).
9. Continue through all 5 Welcome lessons, then the unit quiz.
10. On the quiz, hit "End 🏁" — should redirect back to /map.
```

If the new buttons aren't appearing, you're probably running an
older Vite build. From the project root:

```bash
npm install --no-audit --no-fund
npm run build
```

…and reload with cache-bust (Ctrl-Shift-R / Cmd-Shift-R).


## The Fox helper / AI feature stopped giving smart answers

**Symptom**: The Fox helper inside Lesson / Quiz pages opens, but
every quick-prompt button returns one of the same four canned
sentences ("Great! Try saying: 'I can see a friend.'", "You're doing
great! Keep going and have fun.", etc.) and the parent insight on
`/progress` reads like a generic template.

**Cause**: This is by design. `OpenAiService::isConfigured()` returns
`false` when `OPENAI_API_KEY` is missing or blank in `.env`, and every
public method (`foxHelper`, `parentInsight`, `helpCenterReply`) routes
straight to the `fallback()` keyword-matched canned response. Kids
never see an error — but you also never get a smart answer.

`AudioSegmentationService::WHISPER_ENDPOINT` (the admin auto-segment
button) shares the same `OPENAI_API_KEY`, so when Whisper "stops
working" the fix is the same.

**Fix**:

1. Get an OpenAI API key from <https://platform.openai.com/api-keys>.
2. Edit `.env` in the project root and set:

   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
   OPENAI_MODEL=gpt-4o-mini
   ```

3. Clear Laravel's config cache so the new value is picked up:

   ```bash
   php artisan config:clear
   ```

4. Reload any open lesson page. The Fox helper now shows a small
   "Offline" badge ONLY when the key is missing — once it's set,
   the badge disappears and answers come from the real model.

**How to verify it's working**:

- Visit any lesson page. Open the Fox helper. Tap "Explain this
  word". You should see a tailored, lesson-specific response (e.g.
  "Mum is the lady who loves you the most at home.") rather than
  the canned line.
- Visit `/admin/words` and click "✨ Auto-find this word" on any
  word that's already linked to an audio track. A success toast
  with `mode: "track"` confirms Whisper is reaching the API.

**Cost note**: All AI endpoints are throttled per-IP (`throttle:20,1`)
and the parent insight strips PII before calling OpenAI. Typical cost
for a class of 30 children using the Fox helper a few times per
session is < $0.50/day with `gpt-4o-mini`.

## Audio doesn't mute when I tap the speaker icon in the header

**Symptom**: The 🔊/🔇 chip in the lesson / quiz / map header changes
its icon when tapped but audio keeps playing.

**Cause (now fixed)**: Earlier the icon was a purely-cosmetic local
state on `MapScreen.jsx`. Every audio source (`playAudio.js`,
`soundEffects.js`, `TrackPlayer.jsx`) ignored it and played at full
volume.

**Fix**: This was rebuilt in the May 2026 audio-control refactor.
Every play call now goes through `audioSettings.js`'s
`getEffectiveVolume()` — toggling the chip silences the WHOLE app
(including Web Audio beeps, browser TTS, NCCD tracks, and the Fox
helper). The chip lives in `AppHeader` so it appears on every play
surface, plus the map. Settings persist in `localStorage` and sync
across browser tabs.

If you're seeing audio after a mute on the current branch, hard-
reload the browser (Ctrl+Shift+R) and check the browser console for
any `[Kiddo]` warning. The most common cause is a third-party
extension intercepting `localStorage` writes — disable them and try
again.

## Map pins don't appear / appear in the wrong spot

See [MAP_GUIDE.md](MAP_GUIDE.md) for the full how-to. Quick sanity
checklist:

1. The unit must have `map_x` AND `map_y` saved (either non-null).
   Brand-new units default to NULL → invisible until placed.
2. The hardcoded fallback dictionary in `MapScreen.jsx` only covers
   five units (`UNIT_VISUAL` keys 1-5). Beyond that, you MUST set
   `map_x` / `map_y` from `/admin/units` or the pin won't render.
3. The Arena pin is auto-positioned 18% to the LEFT of Unit 2. Move
   Unit 2 and the Arena follows.
