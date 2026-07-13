# Careers with Em

Marketing site for Careers with Em: AI-powered career systems for job seekers and corporate workers.

Plain HTML/CSS/JS, no build step:

- `index.html`: home
- `prompt-pack.html`: free lead magnet opt-in
- `challenge.html`: The Career OS Challenge sales page
- `dashboard.html`: the Knox Life Dashboard, Em's private alignment board (not linked from the public pages, `noindex`). Built to the Knox Life Dashboard spec: a cycle-aware template engine (standard and luteal weeks graded differently), a daily floor-habits view usable in under a minute, win registration with the one-minute hold, blocker events with time-to-interrupt as the hero trend, the Gem to Greenhouse migration tracker feeding an exportable conversion case, the end-of-2026 marker checklist, and weekly rhythm cards for learning, bids, money, and creative cadence. Logic in `dashboard.js`, its own design system in `dashboard.css` (warm editorial: Cormorant Garamond and Jost, cream and sage and gold; separate from the marketing site's tokens). Installable as a phone app via `manifest.webmanifest` and `sw.js`, fully offline-capable. All data stays in the browser's localStorage, with export/import backup in the page footer. No analytics, no sync.

The visual system (colors, type, spacing, motion) is documented in `TOKENS.md`. Fonts are self-hosted in `fonts/`. Deploys to GitHub Pages automatically on push to `main` via `.github/workflows/pages.yml`.

To preview locally: `python3 -m http.server` from the repo root.
