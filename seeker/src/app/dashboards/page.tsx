import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { FUNNEL_STAGES } from "@/lib/stages";
import {
  DashboardsView,
  type AppDatum,
  type TouchDatum,
} from "@/components/dashboards/DashboardsView";

export const dynamic = "force-dynamic";

export default async function DashboardsPage() {
  const user = await getLocalUser();
  const [applications, touchpoints, buckets] = await Promise.all([
    prisma.application.findMany({
      where: { userId: user.id },
      include: {
        jobPost: { include: { bucket: true } },
        resume: { select: { label: true } },
        stageEvents: true,
      },
    }),
    prisma.touchpoint.findMany({ where: { userId: user.id } }),
    prisma.bucket.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const apps: AppDatum[] = applications.map((a) => {
    // Reaching a stage implies reaching every earlier one — the tracker lets
    // you jump applied -> offer directly, and the funnel must stay monotonic.
    const stageIdx = (s: string) =>
      FUNNEL_STAGES.indexOf(s as (typeof FUNNEL_STAGES)[number]);
    let maxIdx = 0;
    for (const ev of a.stageEvents) {
      maxIdx = Math.max(maxIdx, stageIdx(ev.stage));
    }
    maxIdx = Math.max(maxIdx, stageIdx(a.stage));
    const reached = new Set<string>(FUNNEL_STAGES.slice(0, maxIdx + 1));
    return {
      id: a.id,
      bucketName: a.jobPost.bucket?.name ?? null,
      resumeLabel: a.resume.label,
      appliedAt: a.appliedAt.toISOString(),
      stage: a.stage,
      reached: [...reached],
    };
  });

  const touch: TouchDatum[] = touchpoints.map((t) => ({
    occurredAt: t.occurredAt.toISOString(),
    channel: t.channel,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboards</h1>
      <p className="mt-1 text-sm text-slate-600">
        What&apos;s working: response rates by resume version and bucket, the
        stage funnel, networking activity, and interview outcomes.
      </p>
      <div className="mt-5">
        <DashboardsView
          apps={apps}
          touchpoints={touch}
          buckets={buckets.map((b) => b.name)}
        />
      </div>
    </div>
  );
}
