// Summary templates for the notetaker — the seeker-side mirror of Metaview's
// template library. Each section carries guidance (used in the LLM prompt)
// and keyword matchers (used by the heuristic fallback).

export type CallTemplateSection = {
  title: string;
  guidance: string;
  matchers: RegExp[];
};

export type CallTemplate = {
  id: "recruiter_screen" | "hiring_manager" | "networking";
  label: string;
  sections: CallTemplateSection[];
};

export const CALL_TEMPLATES: CallTemplate[] = [
  {
    id: "recruiter_screen",
    label: "Recruiter screen",
    sections: [
      {
        title: "Role & company",
        guidance:
          "What the recruiter said about the role, team, and company — scope, stage, priorities.",
        matchers: [
          // deliberately no "this role": phrases like "the base for this
          // role" belong to the compensation section, not here
          /the role|the team|the company|we('| a)re (a|an|building)|responsibilit|headcount|about us/i,
        ],
      },
      {
        title: "Your background as discussed",
        guidance:
          "How the seeker's experience and story came up: what they said about their background, and how the recruiter reacted.",
        matchers: [
          /my (background|experience|last role|current role)|i('| ha)ve (been|worked|led|built|coached)|years (of|in)/i,
        ],
      },
      {
        title: "Compensation & logistics",
        guidance:
          "Anything about salary, equity, benefits, location/remote policy, start date, notice period, visa.",
        matchers: [
          /salary|compensation|base|equity|bonus|benefit|\$\s?\d|notice period|start date|remote|hybrid|on-?site|timezone|visa|location/i,
        ],
      },
      {
        title: "Process & next steps",
        guidance:
          "The interview process, timeline, and agreed next steps.",
        matchers: [
          /next step|process|stage|panel|take-?home|hear back|timeline|schedule|follow(-| )?up|within (a|\d)/i,
        ],
      },
      {
        title: "Open questions",
        guidance:
          "Questions that were asked but not fully answered, or that the seeker should ask later.",
        matchers: [/\?\s*$/],
      },
    ],
  },
  {
    id: "hiring_manager",
    label: "Hiring manager interview",
    sections: [
      {
        title: "Role scope & expectations",
        guidance:
          "What success in the role looks like, the first-90-days expectations, and the problems to solve.",
        matchers: [
          /success|first (90|ninety|30|60)|expectation|scope|own(ing)?|deliver|priorit|problem/i,
        ],
      },
      {
        title: "Team & working style",
        guidance:
          "Team composition, reporting lines, collaboration style, and the manager's own style.",
        matchers: [
          /team|report(s|ing)? to|manage|structure|collaborat|work(ing)? style|stand-?up|process/i,
        ],
      },
      {
        title: "Your experience as discussed",
        guidance:
          "Which of the seeker's experiences were probed, examples they gave, and how they landed.",
        matchers: [
          /tell me about|walk me through|example|when (you|i)|my (approach|experience)|i (led|built|ran|designed|coached)/i,
        ],
      },
      {
        title: "Signals & concerns",
        guidance:
          "Explicit or implicit signals: enthusiasm, hesitations, gaps the interviewer flagged.",
        matchers: [/concern|worry|gap|hesitat|impress|excit|strong|risk/i],
      },
      {
        title: "Process & next steps",
        guidance: "What happens after this interview and when.",
        matchers: [
          /next step|next round|process|hear back|timeline|schedule|follow(-| )?up|decision/i,
        ],
      },
    ],
  },
  {
    id: "networking",
    label: "Networking call",
    sections: [
      {
        title: "Who they are",
        guidance:
          "The contact's background, current role, and how they got there.",
        matchers: [
          /i('| a)m (a|the|at)|my (role|background|path|journey)|i (work|joined|started|moved)|been at/i,
        ],
      },
      {
        title: "Insights & advice",
        guidance:
          "Advice, market insights, and opinions they shared.",
        matchers: [
          /advice|recommend|suggest|honestly|my take|what i('| wou)ld do|tip|insight|the market|in my experience/i,
        ],
      },
      {
        title: "Opportunities & leads",
        guidance:
          "Openings, companies, or people they mentioned as leads.",
        matchers: [
          /opening|hiring|opportunity|role at|introduce|intro to|connect you|referr|reach out to|talk to/i,
        ],
      },
      {
        title: "Follow-up actions",
        guidance:
          "What each side agreed to do next: intros, materials, follow-up meetings.",
        matchers: [
          /i('| wi)ll send|send (you|me)|follow(-| )?up|intro|connect|share|email (you|me)|next week|let('s| us)/i,
        ],
      },
    ],
  },
];

export function getCallTemplate(id: string): CallTemplate {
  const found = CALL_TEMPLATES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown call template "${id}"`);
  return found;
}

export function templateSectionsForPrompt(template: CallTemplate): string {
  return template.sections
    .map((s) => `- "${s.title}": ${s.guidance}`)
    .join("\n");
}
