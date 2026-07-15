import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Loads the seed job posts (prisma/seed-data/*.json) for the local user.
// Deliberately standalone — no imports from src/ — so it runs with plain tsx.
// Ranking is done in-app afterwards ("Rank jobs" button or POST /api/jobs/rank).

const prisma = new PrismaClient();
const LOCAL_USER_EMAIL = "emily.may.knox@gmail.com";

type SeedJob = {
  title: string;
  company: string;
  location: string;
  remote: string;
  seniority: string;
  compMin: number | null;
  compMax: number | null;
  compCurrency: string;
  companySize: string | null;
  industry: string | null;
  skills: string[];
  description: string;
  postedDaysAgo: number;
  bucket: string;
};

async function main() {
  const user = await prisma.user.upsert({
    where: { email: LOCAL_USER_EMAIL },
    create: { name: "Emily Knox", email: LOCAL_USER_EMAIL },
    update: {},
  });

  const dir = path.join(process.cwd(), "prisma", "seed-data");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    throw new Error(`No seed files found in ${dir}`);
  }

  let created = 0;
  let skipped = 0;
  for (const file of files) {
    const jobs: SeedJob[] = JSON.parse(
      fs.readFileSync(path.join(dir, file), "utf8"),
    );
    for (const job of jobs) {
      const bucket = await prisma.bucket.upsert({
        where: { userId_name: { userId: user.id, name: job.bucket } },
        create: { userId: user.id, name: job.bucket },
        update: {},
      });
      const exists = await prisma.jobPost.findFirst({
        where: { userId: user.id, title: job.title, company: job.company },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.jobPost.create({
        data: {
          userId: user.id,
          source: "seed",
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote,
          seniority: job.seniority,
          compMin: job.compMin,
          compMax: job.compMax,
          compCurrency: job.compCurrency ?? "USD",
          companySize: job.companySize,
          industry: job.industry,
          skills: JSON.stringify(job.skills ?? []),
          description: job.description,
          postedAt: new Date(
            Date.now() - job.postedDaysAgo * 24 * 60 * 60 * 1000,
          ),
          bucketId: bucket.id,
        },
      });
      created++;
    }
  }
  console.log(
    `Seed complete: ${created} jobs created, ${skipped} already present, ${files.length} bucket files.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
