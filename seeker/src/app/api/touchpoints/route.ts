import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

const BodySchema = z.object({
  contactName: z.string().min(1).max(120),
  company: z.string().max(120).default(""),
  channel: z.enum(["call", "coffee", "email", "linkedin", "event"]),
  occurredAt: z.string().datetime().optional(),
  notes: z.string().max(1000).default(""),
  applicationId: z.string().nullable().optional(),
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
  const { occurredAt, applicationId, ...rest } = parsed.data;
  if (applicationId) {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app || app.userId !== user.id) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }
  }
  const touchpoint = await prisma.touchpoint.create({
    data: {
      userId: user.id,
      ...rest,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      applicationId: applicationId ?? null,
    },
  });
  return NextResponse.json({ touchpoint });
}
