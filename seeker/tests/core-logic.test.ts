import { test } from "node:test";
import assert from "node:assert/strict";

import {
  scoreDeterministicDims,
  applyRankCaps,
  type JobLike,
} from "../src/lib/ai/dims";
import { heuristicNormalizeJob } from "../src/lib/ai/fallback/job";
import { applyRecommendationToResume } from "../src/lib/ai/align";
import { applySuggestionToIjp } from "../src/lib/ai/ijp";
import { parseCompValue } from "../src/lib/parseComp";
import type { IjpData } from "../src/lib/ai/schemas";

// These tests encode the scenarios from the adversarial code review — the
// rank rubric and edit-application rules are enforced in code (not the LLM),
// so they must survive prompt and heuristic iteration.

const baseIjp: IjpData = {
  targetRoles: [],
  industries: ["Edtech"],
  seniority: "Director",
  locations: [],
  remotePreference: "flexible",
  compensationFloor: 120000,
  compensationCurrency: "USD",
  companySizePreference: [],
  dealbreakers: ["no 24/7 on-call", "no 100% travel", "no in-person work"],
  skills: [],
  notes: "",
};

const baseJob = (over: Partial<JobLike>): JobLike => ({
  title: "",
  company: "",
  location: "",
  remote: "remote",
  seniority: "",
  compMin: null,
  compMax: null,
  companySize: null,
  industry: null,
  skills: [],
  description: "",
  ...over,
});

test("seniority: word boundaries and highest-level-first ordering", () => {
  const cases: [string, string][] = [
    ["Director of International Programs", "strong"], // not "intern"
    ["Senior Director of Talent", "strong"], // director beats senior
    ["Head of Internal Communications", "strong"],
  ];
  for (const [title, want] of cases) {
    const dims = scoreDeterministicDims(baseIjp, baseJob({ title }));
    assert.equal(dims.seniority.fit, want, title);
  }
});

test("dealbreakers: substantial tokens on word boundaries only", () => {
  const benign = scoreDeterministicDims(
    baseIjp,
    baseJob({
      description:
        "Founded in 2024 with 7 products and a 401k plan. Personal growth matters.",
    }),
  );
  assert.deepEqual(benign.dealbreakers, []);

  const travel = scoreDeterministicDims(
    baseIjp,
    baseJob({ description: "Expect 100% travel to client sites." }),
  );
  assert.deepEqual(travel.dealbreakers, ["no 100% travel"]);

  const inPerson = scoreDeterministicDims(
    baseIjp,
    baseJob({ description: "This is an in-person role at our office." }),
  );
  assert.deepEqual(inPerson.dealbreakers, ["no in-person work"]);
});

test("location: onsite preference with no listed locations is not penalized", () => {
  const ijp = { ...baseIjp, remotePreference: "onsite" as const };
  const dims = scoreDeterministicDims(
    ijp,
    baseJob({ remote: "onsite", location: "Austin, TX" }),
  );
  assert.equal(dims.location.fit, "strong");
});

test("rank caps: dealbreaker -> poor, weak dim -> okay, partial dim -> good", () => {
  const strongDims = {
    seniority: { fit: "strong" as const, note: "" },
    comp: { fit: "strong" as const, note: "" },
    location: { fit: "strong" as const, note: "" },
    dealbreakers: [] as string[],
  };
  assert.equal(applyRankCaps("great", strongDims, "strong"), "great");
  assert.equal(
    applyRankCaps("great", { ...strongDims, dealbreakers: ["x"] }, "strong"),
    "poor",
  );
  assert.equal(
    applyRankCaps(
      "great",
      { ...strongDims, comp: { fit: "weak", note: "" } },
      "strong",
    ),
    "okay",
  );
  assert.equal(
    applyRankCaps(
      "great",
      { ...strongDims, location: { fit: "partial", note: "" } },
      "strong",
    ),
    "good",
  );
  assert.equal(applyRankCaps("great", strongDims, "weak"), "okay");
});

test("normalize: stipends are not salaries; k-suffix ranges parse", () => {
  assert.equal(
    heuristicNormalizeJob("Role\nWe offer a $500 home office stipend.").compMin,
    null,
  );
  assert.equal(
    heuristicNormalizeJob("Role\nA $500 stipend. Salary: $120,000 per year.")
      .compMin,
    120000,
  );
  const range = heuristicNormalizeJob("Role\nPay: $120 - $140k");
  assert.equal(range.compMin, 120000);
  assert.equal(range.compMax, 140000);
});

test("normalize: negated remote, state-code locations, title/company split", () => {
  assert.equal(
    heuristicNormalizeJob(
      "Role\nRemote: No\nLocation: Austin, TX. This role is on-site.",
    ).remote,
    "onsite",
  );
  assert.equal(
    heuristicNormalizeJob(
      "Role\nPartner with Marketing, IT and Finance. Office in Boston, MA.",
    ).location,
    "Boston, MA",
  );
  const split = heuristicNormalizeJob("Senior Recruiter - Acme\nGreat role.");
  assert.equal(split.title, "Senior Recruiter");
  assert.equal(split.company, "Acme");
  assert.equal(
    heuristicNormalizeJob("Senior Recruiter\nAbout Acme\nWe build tools.")
      .company,
    "Acme",
  );
});

test("align apply: lineNumber hint wins on duplicate lines", () => {
  const resume = ["Line A", "Dup bullet", "Line C", "Dup bullet", "Line E"].join(
    "\n",
  );
  const result = applyRecommendationToResume(resume, {
    type: "remove",
    lineNumber: 4,
    currentText: "Dup bullet",
    suggestedText: "",
  });
  assert.ok(result.ok);
  assert.deepEqual(result.content.split("\n"), [
    "Line A",
    "Dup bullet",
    "Line C",
    "Line E",
  ]);
});

test("align apply: stale target fails cleanly, never fuzzy-overwrites", () => {
  const result = applyRecommendationToResume("Line A\nLine B", {
    type: "replace",
    lineNumber: 1,
    currentText: "Line A extended beyond recognition",
    suggestedText: "X",
  });
  assert.equal(result.ok, false);
});

test("align apply: add appends at end or after its anchor", () => {
  const appended = applyRecommendationToResume("A\nB", {
    type: "add",
    lineNumber: null,
    currentText: "",
    suggestedText: "C",
  });
  assert.ok(appended.ok);
  assert.equal(appended.content, "A\nB\nC");

  const anchored = applyRecommendationToResume("A\nB", {
    type: "add",
    lineNumber: 1,
    currentText: "A",
    suggestedText: "A2",
  });
  assert.ok(anchored.ok);
  assert.equal(anchored.content, "A\nA2\nB");
});

test("ijp apply: set-on-list adds, floor remove clears, k-values parse", () => {
  const setOnList = applySuggestionToIjp(baseIjp, {
    field: "locations",
    action: "set",
    value: "Remote (US)",
    skillPriority: null,
  });
  assert.deepEqual(setOnList.locations, ["Remote (US)"]);

  const floorCleared = applySuggestionToIjp(baseIjp, {
    field: "compensationFloor",
    action: "remove",
    value: "120000",
    skillPriority: null,
  });
  assert.equal(floorCleared.compensationFloor, null);

  const floorK = applySuggestionToIjp(baseIjp, {
    field: "compensationFloor",
    action: "set",
    value: "150k",
    skillPriority: null,
  });
  assert.equal(floorK.compensationFloor, 150000);
});

test("parseCompValue handles common shapes", () => {
  assert.equal(parseCompValue("140k"), 140000);
  assert.equal(parseCompValue("$120,000"), 120000);
  assert.equal(parseCompValue("140"), 140000);
  assert.equal(parseCompValue("nope"), null);
});
