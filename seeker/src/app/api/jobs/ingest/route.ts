import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";
import { toJson } from "@/lib/jsonField";
import { ingestJobPost } from "@/lib/ingest";
import { ijpRowToData } from "@/lib/ai/ijp";
import { rankJob, jobRowToJobLike } from "@/lib/ai/rank";

const BodySchema = z
  .object({
    url: z.string().url().optional(),
    rawText: z.string().optional(),
    bucketId: z.string().nullable().optional(),
    newBucketName: z.string().optional(),
  })
  .refine((b) => b.url || (b.rawText && b.rawText.trim().length >= 100), {
    message: "Provide a URL or at least 100 characters of posting text",
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
  const { url, rawText, newBucketName } = parsed.data;
  let bucketId = parsed.data.bucketId ?? null;

  try {
    const { job, sourceUrl, engine } = await ingestJobPost({ url, rawText });

    if (!bucketId && newBucketName?.trim()) {
      const bucket = await prisma.bucket.upsert({
        where: {
          userId_name: { userId: user.id, name: newBucketName.trim() },
        },
        create: { userId: user.id, name: newBucketName.trim() },
        update: {},
      });
      bucketId = bucket.id;
    }

    const created = await prisma.jobPost.create({
      data: {
        userId: user.id,
        source: sourceUrl ? "url" : "manual",
        url: sourceUrl,
        title: job.title,
        company: job.company,
        location: job.location,
        remote: job.remote,
        seniority: job.seniority,
        compMin: job.compMin,
        compMax: job.compMax,
        compCurrency: job.compCurrency,
        companySize: job.companySize,
        industry: job.industry,
        skills: toJson(job.skills),
        description: job.description,
        postedAt: new Date(),
        bucketId,
      },
    });

    // Rank immediately so the job lands in the list with a score.
    const ijpRow = await prisma.idealJobProfile.findUnique({
      where: { userId: user.id },
    });
    if (ijpRow) {
      const score = await rankJob(ijpRowToData(ijpRow), jobRowToJobLike(created));
      await prisma.jobScore.upsert({
        where: {
          jobPostId_ijpVersion: {
            jobPostId: created.id,
            ijpVersion: ijpRow.version,
          },
        },
        create: { jobPostId: created.id, ijpVersion: ijpRow.version, ...score },
        update: score,
      });
    }

    return NextResponse.json({ job: created, engine });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 422 },
    );
  }
}
