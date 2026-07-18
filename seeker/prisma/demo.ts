import { PrismaClient } from "@prisma/client";

// OPTIONAL demo data so the dashboards aren't empty on a fresh install:
// a second resume version, ~12 applications across buckets and stages, and
// a few weeks of networking touchpoints. Run with `npm run db:demo`.
// Idempotent-ish: skips if demo applications already exist.

const prisma = new PrismaClient();
const LOCAL_USER_EMAIL = "emily.may.knox@gmail.com";
const DEMO_NOTE = "demo data";

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: LOCAL_USER_EMAIL },
  });
  if (!user) throw new Error("Run `npm run db:seed` (and open the app) first.");

  const existing = await prisma.application.count({
    where: { userId: user.id, notes: DEMO_NOTE },
  });
  if (existing > 0) {
    console.log(`Demo data already present (${existing} applications) — nothing to do.`);
    return;
  }

  let resume = await prisma.resume.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!resume) {
    resume = await prisma.resume.create({
      data: {
        userId: user.id,
        label: "v1 — demo placeholder",
        content:
          "DEMO RESUME\n\nSUMMARY\nPlaceholder resume created by the demo script — replace with your own on the Resumes page.\n\nSKILLS\ncareer coaching, recruiting, workshop facilitation",
      },
    });
  }
  const resume2 = await prisma.resume.create({
    data: {
      userId: user.id,
      label: "v2 — coaching-focused (demo)",
      content: resume.content + "\n\n(Coaching-focused demo variant.)",
    },
  });

  const jobs = await prisma.jobPost.findMany({
    where: { userId: user.id, archived: false },
    include: { bucket: true },
    orderBy: { createdAt: "asc" },
  });
  const byBucket = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const key = job.bucket?.name ?? "none";
    byBucket.set(key, [...(byBucket.get(key) ?? []), job]);
  }
  const picks = [...byBucket.entries()]
    .filter(([name]) => name !== "none")
    .flatMap(([, list]) => list.slice(0, 3))
    .slice(0, 12);

  // stage journeys chosen so every dashboard has signal
  const journeys: string[][] = [
    ["screen", "interview", "offer"],
    ["screen", "interview", "rejected"],
    ["screen", "interview"],
    ["screen", "rejected"],
    ["screen"],
    ["ghosted"],
    ["ghosted"],
    [],
    ["screen", "interview", "ghosted"],
    ["rejected"],
    ["screen"],
    [],
  ];

  let created = 0;
  for (let i = 0; i < picks.length; i++) {
    const applied = daysAgo(8 + ((i * 5) % 55));
    const app = await prisma.application.create({
      data: {
        userId: user.id,
        jobPostId: picks[i].id,
        resumeId: i % 2 === 0 ? resume.id : resume2.id,
        appliedAt: applied,
        notes: DEMO_NOTE,
        stageEvents: { create: { stage: "applied", occurredAt: applied } },
      },
    });
    let cursor = applied;
    for (const stage of journeys[i] ?? []) {
      cursor = new Date(cursor.getTime() + 4 * 24 * 60 * 60 * 1000);
      await prisma.application.update({
        where: { id: app.id },
        data: { stage, stageEvents: { create: { stage, occurredAt: cursor } } },
      });
    }
    created++;
  }

  const channels = ["call", "coffee", "email", "linkedin", "event"];
  let touchpoints = 0;
  for (let week = 0; week < 6; week++) {
    const perWeek = (week % 3) + 1;
    for (let k = 0; k < perWeek; k++) {
      await prisma.touchpoint.create({
        data: {
          userId: user.id,
          contactName: `Demo Contact ${week + 1}.${k + 1}`,
          company: "Network Co",
          channel: channels[(week + k) % channels.length],
          occurredAt: daysAgo(week * 7 + k + 1),
          notes: DEMO_NOTE,
        },
      });
      touchpoints++;
    }
  }

  console.log(
    `Demo data created: ${created} applications (2 resume versions) and ${touchpoints} touchpoints. Remove any time by deleting rows with notes="${DEMO_NOTE}".`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
