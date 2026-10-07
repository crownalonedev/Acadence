# Acadence marketing site

This is the public landing page for Acadence. It's a static React + TypeScript + Vite site, separate from the Expo app in the repo root, with its own `package.json`. It has no server runtime: `npm run build` produces a plain `dist/` folder.

```
marketing/
├── index.html, privacy.html, terms.html, 404.html   page entries (SEO meta lives here)
├── public/            favicon, OG image, Cloudflare _headers
├── src/
│   ├── site.ts        public links (GitHub, contact email): edit these first
│   ├── sections/      landing-page sections
│   ├── product/       HTML/CSS recreations of real Acadence UI + sample data
│   ├── components/    nav, footer, brand pill, theme toggle
│   └── styles/global.css   design tokens copied from constants/theme.ts
├── vite.config.ts     multi-page build + robots.txt/sitemap.xml generation
└── wrangler.jsonc     Cloudflare Workers static-assets config
```

See [DESIGN_AUDIT.md](DESIGN_AUDIT.md) for how the site maps to the app's design language, and for what is shown as built versus in progress.

## Local development

Requires Node 20.19+ (or 22.12+).

```bash
cd marketing
npm install
npm run dev          # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint (TypeScript, React Hooks, jsx-a11y) |
| `npm run build` | Typecheck, then a production build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run check` | Typecheck, lint and build in one go |

## Configuration

**Site URL.** Canonical links, Open Graph URLs, `robots.txt` and `sitemap.xml` use `VITE_SITE_URL`, which defaults to `https://acadence.pages.dev`. Set it to your real domain when building:

```bash
VITE_SITE_URL=https://acadence.app npm run build
```

On Cloudflare, add `VITE_SITE_URL` as a build environment variable.

**Links.** Fill these in `src/site.ts`:

- `githubUrl` adds a GitHub icon to the nav, a "Follow on GitHub" button and a footer link. It's empty because the repo is private.
- `contactEmail` adds a "Request early access" mailto button to the final CTA. When both are empty, the CTA shows a "Public beta: coming soon" badge instead.

## Deploying to Cloudflare

The build output is fully static, so either option below works without code changes.

### Option A: Cloudflare Pages (Git integration)

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages → Connect to Git** and pick this repo.
2. Use these build settings:
   - **Root directory:** `marketing`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** `VITE_SITE_URL=https://your-domain`
3. Deploy. Pages serves `privacy.html` at `/privacy`, uses `404.html` for unknown paths and applies `public/_headers`.

Or deploy straight from your machine:

```bash
npm run build
npx wrangler pages deploy dist --project-name acadence
```

### Option B: Cloudflare Workers with static assets

`wrangler.jsonc` already points the Worker's assets at `./dist`, with `404-page` handling and automatic trailing-slash handling:

```bash
npm run build
npx wrangler deploy
```

No Worker script is needed for a static site. Running `npx wrangler dev` previews it locally on the Workers runtime.

### Adding a waitlist or contact endpoint later

The page doesn't need a backend today. If you add a form:

- **Pages:** add `marketing/functions/api/waitlist.ts` exporting `onRequestPost`. Pages Functions deploy with the site automatically.
- **Workers:** add `"main": "src/worker.ts"` and `"run_worker_first": ["/api/*"]` under `assets` in `wrangler.jsonc`. Handle `/api/*` in the Worker and let `env.ASSETS.fetch(request)` serve everything else.

Store signups in D1 or KV through a binding. The Acadence Node backend in `/server` isn't meant to run on Workers.

## Deployment checklist

- [ ] `npm run check` passes
- [ ] `VITE_SITE_URL` is set to the production domain
- [ ] `githubUrl` and `contactEmail` are filled in (if you want them)
- [ ] The Privacy and Terms placeholders are replaced before a public launch
