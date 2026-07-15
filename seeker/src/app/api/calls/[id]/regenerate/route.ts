import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson, toJson } from "@/lib/jsonField";
import { summarizeCall } from "@/lib/ai/call";

const BodySchema = z.object({
  template: z
    .enum(["recruiter_screen", "hiring_manager", "networking"])
    .optional(),
});

// Re-run the summary — e.g. after switching templates, the Metaview
// "rewrite these notes into this format" gesture.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }
  const user = await getLocalUser();
  const call = await prisma.callNote.findUnique({
    where: { id },
    include: { jobPost: true, resume: true },
  });
  if (!call || call.userId !== user.id) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const template = parsed.data.template ?? call.template;
  const { summary, engine } = await summarizeCall(call.transcript, template, {
    jobTitle: call.jobPost?.title ?? null,
    jobDescription: call.jobPost?.description ?? null,
    jobSkills: call.jobPost ? parseJson<string[]>(call.jobPost.skills, []) : [],
    resumeContent: call.resume?.content ?? null,
  });

  const updated = await prisma.callNote.update({
    where: { id },
    data: { template, summary: toJson(summary), engine },
  });

  return NextResponse.json({ call: { id: updated.id }, engine });
}
