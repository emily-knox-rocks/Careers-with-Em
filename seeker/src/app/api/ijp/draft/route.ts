import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { draftIjp, ijpDataToRow } from "@/lib/ai/ijp";

const BodySchema = z.object({
  resume: z.string().min(50, "Paste your full resume (at least 50 characters)"),
  resumeLabel: z.string().default("v1 — intake import"),
  intake: z.object({
    targetRoles: z.string().min(1, "Name at least one target role"),
    industries: z.string().default(""),
    seniority: z.string().min(1, "State your target seniority"),
    locations: z.string().default(""),
    remotePreference: z.enum(["remote", "hybrid", "onsite", "flexible"]),
    compensationFloor: z.string().default(""),
    companySizePreference: z.array(z.string()).default([]),
    dealbreakers: z.string().default(""),
  }),
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
  const { resume, resumeLabel, intake } = parsed.data;
  const user = await getLocalUser();

  const { result: ijpData, engine } = await draftIjp(resume, intake);

  const [resumeRow, ijpRow] = await prisma.$transaction([
    prisma.resume.create({
      data: { userId: user.id, label: resumeLabel, content: resume },
    }),
    prisma.idealJobProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...ijpDataToRow(ijpData) },
      update: { ...ijpDataToRow(ijpData), version: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({
    ijp: ijpRow,
    resumeId: resumeRow.id,
    engine,
  });
}
