export const STAGES = [
  "applied",
  "screen",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;

export type Stage = (typeof STAGES)[number];

// Funnel order — rejected/ghosted are terminal outcomes, not funnel stages.
export const FUNNEL_STAGES = ["applied", "screen", "interview", "offer"] as const;
