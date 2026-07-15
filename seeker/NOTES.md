# NOTES

One lesson per entry. Checked at the start of each milestone.

- **Next.js 16 is in use (create-next-app pulled 16.2.10) and it has breaking changes vs. training data.** `params`/`searchParams` are Promises and must be awaited; Turbopack is the default for dev and build; `next lint` is gone. Consult `node_modules/next/dist/docs/` when unsure.
- **This sandbox has no ANTHROPIC_API_KEY** (API reachable, returns 401). All LLM features must be verified in heuristic fallback mode here; real-LLM paths are code-reviewed but need Emily's key for live verification.
- **The repo root is a deployed static site** — don't touch index.html/styles.css/site.js or the Pages workflow while working on Seeker.
- **Emily's working style (from the brief): act on enough information, record choices in DECISIONS.md, avoid over-engineering, verify every milestone end to end and only report evidence-backed progress.**
