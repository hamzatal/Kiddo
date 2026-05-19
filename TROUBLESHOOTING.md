# Troubleshooting

Quick fixes for the most common Kiddo dev-environment failures.

## Browser shows: "Cannot read properties of null (reading 'createProvider')"

**Root cause:** `@inertiajs/react` evaluates `React.createContext(...)` at
module-load time. If the build splits React and Inertia into separate
vendor chunks, those chunks can be evaluated in the wrong order — and
React is `null` when Inertia first reaches for it.

**Permanent fix (already applied on `main`):** `vite.config.js` now bundles
React, ReactDOM, and `@inertiajs/react` into a single `react-vendor`
chunk and adds them to `optimizeDeps.include` + `resolve.dedupe`. There
is no longer a way for them to load out of order.

**If you're still seeing it on your machine** it's almost always a stale
build artifact. From the project root:

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\scripts\clean-reset.ps1
```

```bash
# macOS / Linux
rm -rf node_modules package-lock.json .vite public/build
npm install --no-audit --no-fund
npm run build
```

Then clear Laravel's caches:

```
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

Hard-reload the page (Ctrl+F5 / Cmd+Shift+R) so the browser drops the
old JS bundle.

## `npm ci` fails with "Missing: <package> from lock file"

The `package-lock.json` shipped with the repo was deliberately removed
on the `fix/lockfile-and-build-stability` branch because it was out of
sync with `package.json` (~95% of declared deps were missing from it).

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

## Never run `npm audit fix --force`

`--force` allows npm to install **major-version upgrades** that don't
satisfy peer-dependency constraints. On 2026-05-19 it tried to push
Vite to a non-existent `8.0.13` and Vitest to `4.1.6`, breaking the
build. Use the targeted `npm audit fix` (without `--force`) and review
each change manually.
