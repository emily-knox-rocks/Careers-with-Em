import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

const BodySchema = z.object({
  jobPostId: z.string().min(1),
  resumeId: z.string().min(1),
  appliedAt: z.string().datetime().optional(),
  notes: z.string().max(2000).default(""),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const { jobPostId, resumeId, appliedAt, notes } = parsed.data;

  const [job, resume] = await Promise.all([
    prisma.jobPost.findUnique({ where: { id: jobPostId } }),
    prisma.resume.findUnique({ where: { id: resumeId } }),
  ]);
  if (!job || job.userId !== user.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!resume || resume.userId !== user.id) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const when = appliedAt ? new Date(appliedAt) : new Date();
  const application = await prisma.application.create({
    data: {
      userId: user.id,
      jobPostId,
      resumeId,
      appliedAt: when,
      notes,
      stageEvents: { create: { stage: "applied", occurredAt: when } },
    },
  });
  return NextResponse.json({ application });
}
