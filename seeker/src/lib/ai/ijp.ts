import type { IdealJobProfile } from "@prisma/client";
import { runPrompt, withFallback } from "@/lib/llm";
import { parseJson, toJson } from "@/lib/jsonField";
import {
  IjpDataSchema,
  type IjpData,
  type IjpSkill,
  type IjpSuggestionItem,
} from "./schemas";
import { heuristicIjpDraft } from "./fallback/ijp";

export type IjpIntake = {
  targetRoles: string;
  industries: string;
  seniority: string;
  locations: string;
  remotePreference: "remote" | "hybrid" | "onsite" | "flexible";
  compensationFloor: string;
  companySizePreference: string[];
  dealbreakers: string;
};

export async function draftIjp(resume: string, intake: IjpIntake) {
  return withFallback(
    () =>
      runPrompt(
        "ijp-draft",
        {
          resume,
          intake: [
            `Target roles: ${intake.targetRoles}`,
            `Industries of interest: ${intake.industries || "(not stated)"}`,
            `Target seniority: ${intake.seniority}`,
            `Locations: ${intake.locations || "(not stated)"}`,
            `Remote preference: ${intake.remotePreference}`,
            `Compensation floor (annual base): ${intake.compensationFloor || "(not stated)"}`,
            `Company size preference: ${intake.companySizePreference.join(", ") || "(indifferent)"}`,
            `Dealbreakers: ${intake.dealbreakers || "(none stated)"}`,
          ].join("\n"),
        },
        IjpDataSchema,
      ),
    () => heuristicIjpDraft(resume, intake),
  );
}

// ---- row <-> data mapping ------------------------------------------------

export function ijpRowToData(row: IdealJobProfile): IjpData {
  return {
    targetRoles: parseJson<string[]>(row.targetRoles, []),
    industries: parseJson<string[]>(row.industries, []),
    seniority: row.seniority,
    locations: parseJson<string[]>(row.locations, []),
    remotePreference:
      (row.remotePreference as IjpData["remotePreference"]) || "flexible",
    compensationFloor: row.compensationFloor,
    compensationCurrency: row.compensationCurrency,
    companySizePreference: parseJson<string[]>(row.companySizePreference, []),
    dealbreakers: parseJson<string[]>(row.dealbreakers, []),
    skills: parseJson<IjpSkill[]>(row.skills, []),
    notes: row.notes,
  };
}

export function ijpDataToRow(data: IjpData) {
  return {
    targetRoles: toJson(data.targetRoles),
    industries: toJson(data.industries),
    seniority: data.seniority,
    locations: toJson(data.locations),
    remotePreference: data.remotePreference,
    compensationFloor: data.compensationFloor,
    compensationCurrency: data.compensationCurrency,
    companySizePreference: toJson(data.companySizePreference),
    dealbreakers: toJson(data.dealbreakers),
    skills: toJson(data.skills),
    notes: data.notes,
  };
}

// ---- applying a confirmed suggestion --------------------------------------

const LIST_FIELDS = new Set([
  "targetRoles",
  "industries",
  "locations",
  "companySizePreference",
  "dealbreakers",
]);

/**
 * Apply one confirmed suggestion to IJP data. Pure function — the caller
 * persists the result and bumps the version.
 */
export function applySuggestionToIjp(
  data: IjpData,
  s: Pick<IjpSuggestionItem, "field" | "action" | "value" | "skillPriority">,
): IjpData {
  const next: IjpData = structuredClone(data);
  const eq = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();

  if (LIST_FIELDS.has(s.field)) {
    const key = s.field as
      | "targetRoles"
      | "industries"
      | "locations"
      | "companySizePreference"
      | "dealbreakers";
    if (s.action === "add" && !next[key].some((v) => eq(v, s.value))) {
      next[key] = [...next[key], s.value];
    } else if (s.action === "remove") {
      next[key] = next[key].filter((v) => !eq(v, s.value));
    }
    return next;
  }

  switch (s.field) {
    case "skills":
      if (s.action === "add" && !next.skills.some((k) => eq(k.name, s.value))) {
        next.skills = [
          ...next.skills,
          { name: s.value, priority: s.skillPriority ?? "nice" },
        ];
      } else if (s.action === "remove") {
        next.skills = next.skills.filter((k) => !eq(k.name, s.value));
      }
      break;
    case "seniority":
      next.seniority = s.value;
      break;
    case "remotePreference": {
      const v = s.value.toLowerCase();
      if (["remote", "hybrid", "onsite", "flexible"].includes(v)) {
        next.remotePreference = v as IjpData["remotePreference"];
      }
      break;
    }
    case "compensationFloor": {
      const n = parseInt(s.value.replace(/[^0-9]/g, ""), 10);
      next.compensationFloor = Number.isFinite(n) ? n : next.compensationFloor;
      break;
    }
    case "notes":
      next.notes = s.value;
      break;
  }
  return next;
}
