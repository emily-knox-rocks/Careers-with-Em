# Seeker

Seeker is the job seeker's mirror of [Metaview](https://www.metaview.ai)'s
agentic recruiting platform. Where Metaview gives recruiters agents for
sourcing, application review, and note-taking, Seeker gives one job seeker the
same machinery pointed the other way: a living profile of the ideal job,
ranked job posts with per-dimension reasoning, an application tracker with
dashboards, resume-to-bucket alignment, and a citation-backed call notetaker.

Built for a single local user. The data model carries a `User` table and
`userId` foreign keys throughout, so multi-tenant later is auth work, not a
schema rewrite.

## Setup

Requires Node.js 20.9+.

```bash
cd seeker
npm install
cp .env.example .env          # then add your ANTHROPIC_API_KEY inside
npx prisma migrate dev        # creates prisma/dev.db (SQLite)
npm run db:seed               # loads 52 seed job posts across 4 buckets
npm run dev                   # http://localhost:3000
```

Without an `ANTHROPIC_API_KEY`, every LLM feature falls back to a
deterministic heuristic and the UI shows a banner — the whole app stays
usable, just less smart. Optional env vars: `SEEKER_MODEL` (defaults to
`claude-opus-4-8`), `SEEKER_LLM=off` to force heuristic mode.

First run: open the app and create your **Ideal Job Profile** (paste a resume
+ short intake), then hit **Rank now** on the Jobs page.

## Prompts

Every LLM prompt lives in its own markdown file under [`prompts/`](./prompts)
with `{{placeholder}}` variables, loaded at runtime — edit a prompt and rerun
the feature; no app code changes, no rebuild in dev.

| Prompt file | Used by |
|---|---|
| `ijp-draft.md` | Drafting the IJP from resume + intake |
| `ijp-suggestions.md` | Turning job feedback into IJP update suggestions |
| `job-normalize.md` | Ingesting a pasted/fetched posting into a structured record |
| `job-rank.md` | Skills fit + overall rank + justification per job |
| `resume-recommendations.md` | Line-level resume edits per bucket |
| `call-summary.md` | Structured, cited call summaries |

## Feature map — which Metaview pattern each feature mirrors

| Seeker feature | Metaview pattern it mirrors |
|---|---|
| **Ideal Job Profile** (`/ijp`) — structured living document drafted from your resume + intake, hand-editable, versioned | The **ICP** built from role context ("Metaview digests your context and gives you a first-draft ICP… you do the final 5%") |
| **Agent suggestions panel** — proposed IJP changes with rationale; nothing applies without your confirm | ICP suggestions from review feedback ("my ICP now has some suggestions… I'm just going to go ahead and confirm") |
| **Job ranking** (`/jobs`) — four-level fit (great/good/okay/poor) with hover justification | Application review's four-level candidate ranking with hover reasoning ("as I hover over each of these rankings, Metaview is giving me its justification") |
| **Per-dimension + per-skill columns** — skills/seniority/comp/location chips plus a sortable column per must-have IJP skill | Per-skill columns from ICP core competencies ("filter by this specific skill… complete control over how you want to manage your pipeline") |
| **Yes/maybe/no + one-line reason** on every job | Sourcing calibration feedback ("leave one to two lines… training the agent to assess profiles the way you do") |
| **Update profile from feedback → re-rank** — accepting a suggestion bumps the IJP version, marks scores stale, one click re-ranks everything | The redo-search / re-evaluate loop ("Metaview re-assessed all of my 95 applications against our new ICP") |
| **Application tracker + dashboards** (`/applications`, `/dashboards`) — stage funnel, response rate by resume version and bucket, outcomes | The pipeline prioritization/analytics layer, pointed at your own funnel instead of a req's |
| **Resume alignment** (`/alignment`) — line-level edit recommendations per bucket, applied only on accept | The ICP-vs-artifact comparison ("compare the interview against your role brief") + the human-confirms-every-change rule |
| **Call notetaker** (`/calls`) — template-based summaries where every live point cites its transcript lines | AI summaries with citations ("as I hover over these notes… citations on the side, the source of truth I can refer back to") and the template library |
| **Multi-source summaries** — attach the JD + resume; document-sourced points are labeled, and a section lists what was never discussed live | Multisource ("if information wasn't discussed in the interview but is clearly stated in the CV, Metaview can still bring that in… pulled out pieces that weren't explicitly discussed") |
| **Ingestion module** (`/jobs/new`, `src/lib/ingest.ts`) — URL or raw text → normalized JobPost; ranking only ever sees the normalized record | Not a UI pattern but the same architecture bet: a clean seam so a live source can plug in without touching the evaluation code |

Source transcripts: `../Metaview_tutorial_transcripts.docx` (repo root).

## Architecture notes

- **Next.js 16** (App Router) + TypeScript + Tailwind v4, **Prisma 6 + SQLite**.
- **LLM layer** (`src/lib/llm.ts`): Anthropic API with structured outputs
  (zod-validated) when a key is present; every feature has a deterministic
  fallback in `src/lib/ai/fallback/`. The engine that produced each result is
  stored and shown in the UI.
- **Ranking rubric is enforced in code** in both modes
  (`src/lib/ai/dims.ts`): seniority/comp/location are scored
  deterministically from structured fields; dealbreakers cap a job at
  *poor*, and weak dimensions cap at *okay*/*good* — the LLM contributes
  skills judgment and prose, not the rules.
- **Scores are stamped with the IJP version** that produced them, which is
  what makes the "profile changed → re-rank" loop cheap and explicit.
- See `DECISIONS.md` for the running decision log and `NOTES.md` for
  operational lessons.
