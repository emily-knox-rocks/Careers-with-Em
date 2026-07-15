import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson, toJson } from "@/lib/jsonField";
import { normalizeTranscript, summarizeCall } from "@/lib/ai/call";

const BodySchema = z.object({
  title: z.string().min(1).max(160),
  template: z.enum(["recruiter_screen", "hiring_manager", "networking"]),
  transcript: z.string().min(80, "Paste or upload the transcript text (at least 80 characters)"),
  jobPostId: z.string().nullable().optional(),
  resumeId: z.string().nullable().optional(),
  applicationId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const { title, template, jobPostId, resumeId, applicationId } = parsed.data;
  const transcript = normalizeTranscript(parsed.data.transcript);

  const [job, resume] = await Promise.all([
    jobPostId ? prisma.jobPost.findUnique({ where: { id: jobPostId } }) : null,
    resumeId ? prisma.resume.findUnique({ where: { id: resumeId } }) : null,
  ]);
  if (jobPostId && (!job || job.userId !== user.id)) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (resumeId && (!resume || resume.userId !== user.id)) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const { summary, engine } = await summarizeCall(transcript, template, {
    jobTitle: job?.title ?? null,
    jobDescription: job?.description ?? null,
    jobSkills: job ? parseJson<string[]>(job.skills, []) : [],
    resumeContent: resume?.content ?? null,
  });

  const call = await prisma.callNote.create({
    data: {
      userId: user.id,
      title,
      template,
      transcript,
      jobPostId: jobPostId ?? null,
      resumeId: resumeId ?? null,
      applicationId: applicationId ?? null,
      summary: toJson(summary),
      engine,
    },
  });

  return NextResponse.json({ call: { id: call.id }, engine });
}
