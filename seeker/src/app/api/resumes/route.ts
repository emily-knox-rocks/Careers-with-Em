import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

export async function GET() {
  const user = await getLocalUser();
  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true },
  });
  return NextResponse.json({ resumes });
}

const BodySchema = z.object({
  label: z.string().min(1).max(120),
  content: z.string().min(50, "Paste the full resume text"),
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
  const resume = await prisma.resume.create({
    data: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({ resume });
}
