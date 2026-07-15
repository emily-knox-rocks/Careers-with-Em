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

  const funnelSet = new Set<string>(FUNNEL_STAGES);
  const apps: AppDatum[] = applications.map((a) => {
    const reached = new Set<string>(["applied"]);
    for (const ev of a.stageEvents) {
      if (funnelSet.has(ev.stage)) reached.add(ev.stage);
    }
    if (funnelSet.has(a.stage)) reached.add(a.stage);
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
