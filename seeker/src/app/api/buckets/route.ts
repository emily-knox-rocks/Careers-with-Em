import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocalUser } from "@/lib/user";

export async function GET() {
  const user = await getLocalUser();
  const buckets = await prisma.bucket.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ buckets });
}

const BodySchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).default(""),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const user = await getLocalUser();
  const bucket = await prisma.bucket.upsert({
    where: { userId_name: { userId: user.id, name: parsed.data.name } },
    create: { userId: user.id, ...parsed.data },
    update: { description: parsed.data.description },
  });
  return NextResponse.json({ bucket });
}
