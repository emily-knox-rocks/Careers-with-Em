import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { ijpRowToData } from "@/lib/ai/ijp";
import { IjpEditor } from "@/components/ijp/IjpEditor";
import {
  SuggestionPanel,
  type SuggestionView,
} from "@/components/ijp/SuggestionPanel";

export const dynamic = "force-dynamic";

export default async function IjpPage() {
  const user = await getLocalUser();
  const ijp = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });

  if (!ijp) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold">Ideal Job Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your IJP is the living document every other feature keys off — the
          seeker-side mirror of a recruiter&apos;s ideal candidate profile.
          Draft it from your resume and a short intake.
        </p>
        <Link
          href="/ijp/new"
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Draft my IJP
        </Link>
      </div>
    );
  }

  const pending = await prisma.ijpSuggestion.findMany({
    where: { userId: user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  const suggestions: SuggestionView[] = pending.map((s) => ({
    id: s.id,
    field: s.field,
    currentValue: s.currentValue,
    suggestedValue: s.suggestedValue,
    rationale: s.rationale,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ideal Job Profile</h1>
          <p className="mt-1 text-sm text-slate-600">
            Jobs are ranked against this document. Edit anything; the agent
            proposes updates from your feedback, and nothing changes without
            your confirmation.
          </p>
        </div>
        <Link
          href="/ijp/new"
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          title="Re-draft from a new resume + intake (replaces the current draft)"
        >
          Re-draft from resume
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <IjpEditor initial={ijpRowToData(ijp)} version={ijp.version} />
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Agent suggestions{" "}
            {suggestions.length > 0 && (
              <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {suggestions.length}
              </span>
            )}
          </h2>
          <SuggestionPanel suggestions={suggestions} />
        </div>
      </div>
    </div>
  );
}
