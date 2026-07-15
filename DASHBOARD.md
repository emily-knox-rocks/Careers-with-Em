# Talent Systems OS — `dashboard.html`

A personal operating dashboard for the Talent Systems PM role at Overwatch: the
work board (pipeline, integrations, vendors, AI pilots, wins, exec reporting) fused
with an energy-aware planning layer built for ADHD + PMDD realities. One page, no
build step, no backend — open `dashboard.html` in a browser and go.

It is intentionally **not linked from the public site nav**: it's a personal tool
that happens to live in this repo.

## The idea

Sustained outperformance is a scheduling problem, not a willpower problem. The
board does three things:

1. **Puts the day's real capacity first.** One energy tap (1–5) reshapes the day:
   low energy collapses the plan to a single must-win and dims everything
   non-essential ("protect mode"); high energy points you at the hardest strategic
   work while the fuel is cheap ("strike mode").
2. **Plans visibility around the cycle, not against it.** A 4-phase model forecasts
   the next 14 days so exec presentations, negotiations, and big asks land in peak
   windows — and the PMDD watch window gets buffers, not white-knuckling.
3. **Keeps receipts.** The wins log and the auto-composed weekly exec update turn
   the work into visible, decision-ready evidence — so influence comes from
   receipts, not from being the loudest in the room, and the promotion case writes
   itself as you go.

## Daily flow (~2 minutes)

1. **Startup ritual** (Rituals card): meds/water/food, sweep the integration board,
   set needle movers, defend one focus block, log energy.
2. **Log energy** in the header — the operating note tells you what mode you're in.
3. Work the **must-win** first, in **focus blocks** (`T` starts/pauses the timer;
   it chimes into a 5-minute break and counts your blocks).
4. Racing thought mid-block? `C` jumps to **quick capture** — park it, stay on task.
5. **Shutdown ritual**: close loops, empty your head, log the day's win, set
   tomorrow's must-win, hard stop.

## Weekly flow (Friday, ~25 minutes)

Refresh funnel + KPI numbers from Gem/Snowflake, advance vendor/pilot stages,
write the TL;DR, hit **Copy update** — the exec update is composed live from the
board (system health, pipeline, shipped/decided, in flight, next week). Then plan
next week against the 14-day cycle ribbon.

## The cycle model (read this once)

- You set **last period start**, **cycle length** (21–40), and **period length**
  in the card's settings. Everything else is computed.
- Ovulation is estimated at `cycle length − 14` (the luteal phase is held at ~14
  days, which is the standard planning approximation). Phases: menstrual (days
  1–period), follicular, ovulatory (ovulation ±1 day), luteal. The **PMDD watch
  window** is the last ~6 days of the cycle.
- **This is a planning model, not medical advice or a diagnosis.** Real cycles
  vary month to month and person to person. The energy log (14-day chart) is the
  ground truth — tune the dates until the ribbon matches your lived pattern. PMDD
  deserves clinical support; the dashboard just makes the calendar absorb it.
- The **burnout guardrail** is a transparent rule: consecutive days logged at 2 or
  below. Two trips a caution; three puts the whole board in protect mode.

## Data & privacy

- Everything lives in **`localStorage` in your browser** (`cwem.dashboard.v1`).
  Nothing is transmitted anywhere. Cycle and energy data are health-adjacent —
  treat backups accordingly.
- **Data ▾ → Export backup** downloads a JSON snapshot; **Import** restores it.
  Do this before switching machines/browsers, and know that anyone with the
  backup file (or this browser profile) can read it.
- First load ships **sample work data** (marked where relevant) so the board makes
  sense immediately — every number and row is editable or deletable. Reset from
  the Data menu re-seeds.

## Customizing

All in `dashboard.html`:

- **Ritual checklists**: `RIT_M`, `RIT_S`, `RIT_W` arrays.
- **Phase guidance copy**: the `PHASES` object.
- **Workday bounds** for the header progress line: `9*60` / `17.5*60` in
  `renderHead` (and the boot interval).
- **Funnel stages**: `STAGES` (the ordinal ramp has 5 validated steps; if you add
  stages, re-validate the ramp — see below).
- **Tracker stages**: `TRK_DEFS`.

## Design notes

- Chrome reuses the Careers-with-Em brand tokens (`TOKENS.md`): Albert Sans /
  Inter (self-hosted in `fonts/`), Motion-derived radii, shadows, and blue.
- Charts follow the dataviz standard: cycle-phase categorical palette and the
  blue ordinal funnel ramp are **CVD-validated in both light and dark modes**
  against the dashboard's actual card surfaces (light `#ffffff`, dark `#171d24`),
  all-pairs for the 4 phase slots. Light-mode magenta/yellow sit below 3:1
  contrast by design, so the ribbon always ships a legend, in-cell labels,
  tooltips, and a table view; status colors never appear without an icon + label.
  Every chart has a table-view twin.
- Dark mode is a **selected** palette (its own steps), not an auto-flip; the
  toggle cycles auto → light → dark and beats the OS setting both ways.
- `prefers-reduced-motion` collapses all animation. All user-entered text is
  rendered via `textContent` (no injection surface).
