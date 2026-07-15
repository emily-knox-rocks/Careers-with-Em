import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { parseJson } from "@/lib/jsonField";
import { generateAlignRecommendations } from "@/lib/ai/align";

const BodySchema = z.object({
  bucketId: z.string().min(1),
  resumeId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "bucketId and resumeId are required" },
      { status: 400 },
    );
  }
  const user = await getLocalUser();
  const { bucketId, resumeId } = parsed.data;

  const [bucket, resume, jobs] = await Promise.all([
    prisma.bucket.findUnique({ where: { id: bucketId } }),
    prisma.resume.findUnique({ where: { id: resumeId } }),
    prisma.jobPost.findMany({
      where: { bucketId, userId: user.id, archived: false },
    }),
  ]);
  if (!bucket || bucket.userId !== user.id) {
    return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
  }
  if (!resume || resume.userId !== user.id) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
  if (jobs.length === 0) {
    return NextResponse.json(
      { error: "This bucket has no job posts to compare against." },
      { status: 400 },
    );
  }

  const { recommendations, engine } = await generateAlignRecommendations(
    resume.content,
    jobs.map((j) => ({
      title: j.title,
      company: j.company,
      skills: parseJson<string[]>(j.skills, []),
      description: j.description,
    })),
    bucket.name,
  );

  const runId = randomUUID();
  await prisma.$transaction(
    recommendations.map((rec) =>
      prisma.resumeRecommendation.create({
        data: {
          bucketId,
          resumeId,
          runId,
          type: rec.type,
          lineNumber: rec.lineNumber,
          currentText: rec.currentText,
          suggestedText: rec.suggestedText,
          reason: rec.reason,
        },
      }),
    ),
  );

  return NextResponse.json({
    runId,
    created: recommendations.length,
    engine,
  });
}
