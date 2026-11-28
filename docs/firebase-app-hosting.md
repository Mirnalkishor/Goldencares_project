# Firebase App Hosting runbook (TanStack Start)

The web app is now built for **Node on Firebase App Hosting** in the same Firebase project as the backend (`golden-care-d4863`). Cloudflare Worker config is gone.

## What changed in the repo

- `vite.config.js`: `@cloudflare/vite-plugin` replaced by `@tanstack/nitro-v2-vite-plugin` with `preset: "firebase_app_hosting"` (stable Nitro 2, the plugin TanStack ships for Start >=1.132).
- `src/server.js`: still TanStack's fetch handler; Nitro wraps it in a real Node HTTP server that listens on `PORT` (App Hosting health check requirement).
- `src/lib/error-capture.server.js`: no `cloudflare:workers` import — portable `process.env` + background-promise shim for Cloud Run.
- `apphosting.yaml`: Cloud Run sizing and the public `VITE_*` build variables. The Firebase web API key is **not** stored in git: `vite.config.js` reads App Hosting's automatically injected `FIREBASE_WEBAPP_CONFIG` at build time.
- `src/lib/analytics.js` + `src/routes/__root.jsx`: GA4 through the existing Firebase Analytics SDK (one `page_view` per TanStack route change) and Microsoft Clarity (`zkgmc21gyu`) via its standard head snippet. Both are client-only; SSR emits no trackers.
- `.env.example` adds `VITE_CLARITY_PROJECT_ID`.

Local validation (already run): `npm run build` produced `.output/server/index.mjs` and `.apphosting/bundle.yaml` with `runCommand: node .output/server/index.mjs`; `npm run lint`, `npm test` (7/7), `git diff --check` all pass; a local `PORT=4178 node .output/server/index.mjs` served `/` with HTTP 200 and the Clarity snippet in the rendered HTML.

## Before deploying

1. **Push this branch** `hardwork` to `origin` — App Hosting builds from GitHub, not from your laptop. (No push has been made as part of this change.)
2. Firebase CLI >= 13.15.4 and a project Owner account for the first backend. In this environment, `gcloud` is logged in as `sagarkumarweebly@gmail.com` and `gcloud projects describe golden-care-d4863` succeeds.
3. Enable **Phone** sign-in in Firebase Authentication (activation needs real SMS OTP).
4. Choose an App Hosting region: `asia-southeast1` (Singapore) is the closest supported region to India. App Hosting does not support `asia-south1`; Firestore remains in Mumbai, so calls cross regions but work normally.

## Create the backend

Console: Firebase → **App Hosting** → **Create backend** → connect `goldencares-project/Goldencares_project` → region `asia-southeast1` → repository root `/realf` (the `package.json` directory) → live branch `hardwork` → Node.js 22 → finish and deploy.

CLI equivalent:

```bash
cd /home/sagaranmol/newgc/realf
firebase apphosting:backends:create --project golden-care-d4863
```

App Hosting's buildpack runs `npm ci && npm run build`, reads `apphosting.yaml`, and Nitro's generated `.apphosting/bundle.yaml` supplies the run command. No Dockerfile, rewrite rule, or separate web project is needed.

## Domain + Auth configuration

1. In the backend's **Domains** tab, add `goldencares.in` and `www.goldencares.in`, then add the DNS records Firebase shows.
2. Firebase Auth → **Settings → Authorized domains**: add `goldencares.in` and `www.goldencares.in`. The activation email's continue URL is `https://goldencares.in/verify-email`, so that domain must be authorized.
3. Authentication → **Sign-in method**: Email/Password and Phone both enabled. Phone Auth SMS billing is separate from hosting cost.

## Verify analytics after the first rollout

- **Microsoft Clarity** (`zkgmc21gyu`): open the Clarity project → Dashboard; within a few minutes a live visit should appear with heatmaps/session recordings.
- **GA4** (`G-1E46FR6MEM`, initialized by the Firebase web SDK): Firebase Analytics DebugView or GA4 Realtime should show `page_view` events with `page_path`. Note that Firebase Analytics counts are separate from the GA4 property Realtime view if the property was linked differently; use DebugView for immediate confirmation.
- To change the Clarity project without a code change, set `VITE_CLARITY_PROJECT_ID` in `apphosting.yaml` or the Firebase console.

## Cost expectation

Blaze is already required for Cloud Functions. App Hosting's underlying Cloud Run free allowance (2M requests, 180k vCPU-s, 360k GiB-s per month) plus 10 GiB CDN transfer covers this site comfortably, so expect **~$0/month** at current traffic. `minInstances: 0` keeps idle cost at zero at the price of a cold start; set it to `1` (~$10/mo) if cold starts become noticeable.
