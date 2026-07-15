# DECISIONS

One decision per entry, with one line of reasoning.

- **App lives in `seeker/` subdirectory.** The repo root already hosts the static Careers-with-Em brand site (index.html + GitHub Pages workflow); nesting the Next.js app avoids clobbering it.
- **LLM layer: real Anthropic API when `ANTHROPIC_API_KEY` is set, deterministic heuristic fallback otherwise.** This sandbox has no API key, and the working agreement requires end-to-end verification of every milestone — the fallback keeps every flow runnable and testable without a key, and the UI shows a banner so you always know which mode you're in.
- **Default model `claude-opus-4-8`, overridable via `SEEKER_MODEL` env var.** Current recommended Opus-tier model per Anthropic docs; env override lets you trade cost/quality without code changes.
- **Prompts are markdown files with `{{placeholder}}` templates in `/prompts`, loaded at runtime.** Editing a prompt never touches app code, per your requirement; runtime loading means no rebuild to iterate.
- **Multi-tenant readiness = a `User` table and `userId` FK on top-level entities, nothing more.** Seeded with one local user; no auth, sessions, or tenancy middleware in the MVP.
- **Job fit scoring is hybrid: deterministic per-dimension scoring (seniority/comp/location) + LLM for skills assessment and justifications.** Structured fields compare reliably in code; the LLM adds judgment where keyword matching fails. In fallback mode skills use keyword overlap.
- **Buckets live on `JobPost`; applications inherit the job's bucket.** One source of truth for grouping — dashboards and alignment both group by the job's bucket, no divergence possible.
- **`JobScore` rows are stamped with the IJP version that produced them.** Mirrors Metaview's "re-evaluate against new ICP": when the IJP changes, stale scores are detectable and re-rankable.
- **Notetaker MVP accepts pasted/uploaded transcript text (.txt/.vtt), not audio.** The Anthropic API doesn't transcribe audio; adding a speech-to-text vendor is out of MVP scope. The upload interface is written so a transcription step can slot in front later.
- **Stage history in a `StageEvent` table, current stage denormalized on `Application`.** The funnel and time-in-stage dashboards need transitions, not just current state.
- **Prisma pinned to v6, not v7.** Prisma 7 (released after the scaffold) moved connection URLs out of schema.prisma into a new config system; v6 is the stable, well-documented API and avoids fighting a brand-new config format in an MVP.
- **Charts with Recharts.** Standard React charting library, plays well with Tailwind, no D3 hand-rolling for an MVP.
- **Ingestion module normalizes via LLM prompt (`job-normalize`) with regex-based fallback; URL mode fetches server-side then normalizes text.** Same clean interface (`ingestJobPost(input) → JobPost`) regardless of source, so a live job-board API can plug in later without touching ranking code.
