import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { ijpRowToData } from "@/lib/ai/ijp";
import { rankJob, jobRowToJobLike } from "@/lib/ai/rank";

// Score every job that has no score for the CURRENT IJP version (new jobs,
// or all jobs after the IJP changed — Metaview's "re-evaluate the pipeline
// against the new ICP" moment).
export async function POST() {
  const user = await getLocalUser();
  const ijpRow = await prisma.idealJobProfile.findUnique({
    where: { userId: user.id },
  });
  if (!ijpRow) {
    return NextResponse.json(
      { error: "Create your IJP before ranking jobs." },
      { status: 400 },
    );
  }
  const ijp = ijpRowToData(ijpRow);

  const jobs = await prisma.jobPost.findMany({
    where: {
      userId: user.id,
      archived: false,
      scores: { none: { ijpVersion: ijpRow.version } },
    },
  });

  let ranked = 0;
  const engines = new Set<string>();
  for (const job of jobs) {
    const score = await rankJob(ijp, jobRowToJobLike(job));
    engines.add(score.engine);
    await prisma.jobScore.upsert({
      where: {
        jobPostId_ijpVersion: { jobPostId: job.id, ijpVersion: ijpRow.version },
      },
      create: { jobPostId: job.id, ijpVersion: ijpRow.version, ...score },
      update: score,
    });
    ranked++;
  }

  return NextResponse.json({
    ranked,
    ijpVersion: ijpRow.version,
    engine: engines.size === 1 ? [...engines][0] : [...engines].join("+") || "none",
  });
}
