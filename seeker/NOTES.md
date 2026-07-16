# NOTES

One lesson per entry. Checked at the start of each milestone.

- **Next.js 16 is in use (create-next-app pulled 16.2.10) and it has breaking changes vs. training data.** `params`/`searchParams` are Promises and must be awaited; Turbopack is the default for dev and build; `next lint` is gone. Consult `node_modules/next/dist/docs/` when unsure.
- **This sandbox has no ANTHROPIC_API_KEY** (API reachable, returns 401). All LLM features must be verified in heuristic fallback mode here; real-LLM paths are code-reviewed but need Emily's key for live verification.
- **The repo root is a deployed static site** — don't touch index.html/styles.css/site.js or the Pages workflow while working on Seeker.
- **Heuristic keyword matchers over-fire without an all-tokens rule.** The dealbreaker check originally matched ANY distinctive token ("no 100% travel" fired on any posting mentioning travel); requiring every token fixed the rank distribution. Bias heuristics conservative.
- **Subagents normalize enum labels unless told the exact strings are load-bearing.** The seed validator "fixed" companySize values into a different format; always re-verify enum fields after delegated data generation.
- **React splits interpolated JSX text with HTML comments** (`52<!-- --> jobs`), so curl+grep checks against rendered pages need loose patterns.
- **Emily's working style (from the brief): act on enough information, record choices in DECISIONS.md, avoid over-engineering, verify every milestone end to end and only report evidence-backed progress.**
- **The remote container can be recycled between sessions, wiping gitignored files (dev.db) while tracked files survive.** Recovery is exactly the README setup path (migrate deploy + db:seed) — which also proved the fresh-install instructions work.
- **An empty "confirmed findings" list from a review pipeline can mean "verification never ran", not "clean".** The verify stage hit a usage limit; always check the failure list before trusting an empty result.
