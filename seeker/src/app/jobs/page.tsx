import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson } from "@/lib/jsonField";
import { ijpRowToData } from "@/lib/ai/ijp";
import type { IjpSkill, SkillBreakdownItem } from "@/lib/ai/schemas";
import { JobsTable } from "@/components/jobs/JobsTable";
import type { JobRowView } from "@/components/jobs/types";

export const dynamic = "force-dynamic";

function compDisplay(min: number | null, max: number | null): string {
  const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
  if (min && max && min !== max) return `${fmt(min)}–${fmt(max)}`;
  if (min || max) return fmt((min ?? max)!);
  return "";
}

export default async function JobsPage() {
  const user = await getLocalUser();
  const [ijpRow, jobs, buckets, unconsumedFeedback] = await Promise.all([
    prisma.idealJobProfile.findUnique({ where: { userId: user.id } }),
    prisma.jobPost.findMany({
      where: { userId: user.id, archived: false },
      include: {
        bucket: true,
        scores: { orderBy: { ijpVersion: "desc" }, take: 1 },
        feedback: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bucket.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.jobFeedback.count({
      where: { consumedAt: null, jobPost: { userId: user.id } },
    }),
  ]);

  if (!ijpRow) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <p className="mt-2 text-sm text-slate-600">
          Jobs are ranked against your Ideal Job Profile — create it first.
        </p>
        <Link
          href="/ijp/new"
          className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create your IJP
        </Link>
      </div>
    );
  }

  const ijp = ijpRowToData(ijpRow);
  const mustSkills = ijp.skills
    .filter((s: IjpSkill) => s.priority === "must")
    .map((s) => s.name);

  const rows: JobRowView[] = jobs.map((job) => {
    const score = job.scores[0] ?? null;
    const stale = score ? score.ijpVersion !== ijpRow.version : true;
    const breakdown = score
      ? parseJson<SkillBreakdownItem[]>(score.skillBreakdown, [])
      : [];
    const skillLevels: JobRowView["skillLevels"] = {};
    for (const item of breakdown) {
      skillLevels[item.skill] = { level: item.level, note: item.note };
    }
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      bucketName: job.bucket?.name ?? null,
      location: job.location,
      remote: job.remote,
      comp: compDisplay(job.compMin, job.compMax),
      companySize: job.companySize,
      industry: job.industry,
      postedAt: job.postedAt?.toISOString() ?? null,
      overall: score?.overall ?? null,
      justification: score?.justification ?? "",
      engine: score?.engine ?? "",
      stale,
      dims: score
        ? {
            skills: { fit: score.skillsFit, note: score.skillsNote },
            seniority: { fit: score.seniorityFit, note: score.seniorityNote },
            comp: { fit: score.compFit, note: score.compNote },
            location: { fit: score.locationFit, note: score.locationNote },
          }
        : null,
      skillLevels,
      feedback: job.feedback[0]
        ? { verdict: job.feedback[0].verdict, reason: job.feedback[0].reason }
        : null,
    };
  });

  const staleCount = rows.filter((r) => r.stale).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ranked against IJP v{ijpRow.version}. Hover a fit badge for the
            agent&apos;s reasoning; leave yes/maybe/no feedback to train it.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add job
        </Link>
      </div>
      <div className="mt-5">
        <JobsTable
          rows={rows}
          buckets={buckets.map((b) => ({ id: b.id, name: b.name }))}
          mustSkills={mustSkills}
          staleCount={staleCount}
          unconsumedFeedback={unconsumedFeedback}
        />
      </div>
    </div>
  );
}
