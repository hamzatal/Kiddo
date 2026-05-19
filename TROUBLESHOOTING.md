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
