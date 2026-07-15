import { z } from "zod";

// Shared zod schemas for structured LLM outputs. These are also the shapes
// stored in the DB's JSON string fields, so heuristic fallbacks reuse them.

export const RemotePreference = z.enum([
  "remote",
  "hybrid",
  "onsite",
  "flexible",
]);

export const IjpSkillSchema = z.object({
  name: z.string(),
  priority: z.enum(["must", "nice"]),
});
export type IjpSkill = z.infer<typeof IjpSkillSchema>;

export const IjpDataSchema = z.object({
  targetRoles: z.array(z.string()),
  industries: z.array(z.string()),
  seniority: z.string(),
  locations: z.array(z.string()),
  remotePreference: RemotePreference,
  compensationFloor: z.number().nullable(),
  compensationCurrency: z.string(),
  companySizePreference: z.array(z.string()),
  dealbreakers: z.array(z.string()),
  skills: z.array(IjpSkillSchema),
  notes: z.string(),
});
export type IjpData = z.infer<typeof IjpDataSchema>;

// A proposed change to one IJP field. List fields use add/remove; scalar
// fields use set. `value` is always a plain string (numbers as digits).
export const IjpSuggestionItemSchema = z.object({
  field: z.enum([
    "targetRoles",
    "industries",
    "seniority",
    "locations",
    "remotePreference",
    "compensationFloor",
    "companySizePreference",
    "dealbreakers",
    "skills",
    "notes",
  ]),
  action: z.enum(["add", "remove", "set"]),
  value: z.string(),
  // for skills adds: whether it's a must-have; ignored elsewhere
  skillPriority: z.enum(["must", "nice"]).nullable(),
  rationale: z.string(),
});
export type IjpSuggestionItem = z.infer<typeof IjpSuggestionItemSchema>;

export const IjpSuggestionsSchema = z.object({
  suggestions: z.array(IjpSuggestionItemSchema),
});

export const NormalizedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.enum(["remote", "hybrid", "onsite"]),
  seniority: z.string(),
  compMin: z.number().nullable(),
  compMax: z.number().nullable(),
  compCurrency: z.string(),
  companySize: z.string().nullable(),
  industry: z.string().nullable(),
  skills: z.array(z.string()),
  description: z.string(),
});
export type NormalizedJob = z.infer<typeof NormalizedJobSchema>;

export const FitLevel = z.enum(["strong", "partial", "weak"]);
export type FitLevelT = z.infer<typeof FitLevel>;

export const SkillBreakdownItemSchema = z.object({
  skill: z.string(),
  level: z.enum(["strong", "partial", "weak", "missing"]),
  note: z.string(),
});
export type SkillBreakdownItem = z.infer<typeof SkillBreakdownItemSchema>;

// The LLM scores skills fit + overall + justification; the deterministic
// dimensions (seniority/comp/location) are computed in code and passed in.
export const JobRankSchema = z.object({
  overall: z.enum(["great", "good", "okay", "poor"]),
  justification: z.string(),
  skillsFit: FitLevel,
  skillsNote: z.string(),
  skillBreakdown: z.array(SkillBreakdownItemSchema),
});
export type JobRank = z.infer<typeof JobRankSchema>;

export const ResumeRecommendationItemSchema = z.object({
  type: z.enum(["replace", "add", "remove"]),
  lineNumber: z.number().nullable(),
  currentText: z.string(),
  suggestedText: z.string(),
  reason: z.string(),
});
export type ResumeRecommendationItem = z.infer<
  typeof ResumeRecommendationItemSchema
>;

export const ResumeRecommendationsSchema = z.object({
  recommendations: z.array(ResumeRecommendationItemSchema),
});

export const SummaryPointSchema = z.object({
  text: z.string(),
  // 1-based transcript line numbers backing this point (empty when the point
  // comes from a document source rather than the live conversation)
  citations: z.array(z.number()),
  origin: z.enum(["transcript", "job_description", "resume"]),
});
export type SummaryPoint = z.infer<typeof SummaryPointSchema>;

export const CallSummarySchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      points: z.array(SummaryPointSchema),
    }),
  ),
  // Important facts that appear only in attached documents and were never
  // discussed live (Metaview multi-source pattern).
  notCovered: z.array(
    z.object({
      text: z.string(),
      origin: z.enum(["job_description", "resume"]),
    }),
  ),
});
export type CallSummary = z.infer<typeof CallSummarySchema>;
