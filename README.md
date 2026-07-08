# Careers with Em

Marketing site for Careers with Em: AI-powered career systems for job seekers and corporate workers.

Plain HTML/CSS/JS, no build step:

- `index.html`: home
- `prompt-pack.html`: free lead magnet opt-in
- `challenge.html`: The Career OS Challenge sales page
- `dashboard.html`: Mission Control, Em's private life dashboard (not linked from the public pages, `noindex`). A GitHub-style showing-up heatmap, the A to Z plan as a step engine that auto-populates the next step, Whoop and workout logs, and a connections mini-CRM. Logic in `dashboard.js`, styles in `dashboard.css`, the plan itself in `plan-data.js`. All data stays in the browser's localStorage, with export/import backup in the page footer.

The visual system (colors, type, spacing, motion) is documented in `TOKENS.md`. Fonts are self-hosted in `fonts/`. Deploys to GitHub Pages automatically on push to `main` via `.github/workflows/pages.yml`.

To preview locally: `python3 -m http.server` from the repo root.
