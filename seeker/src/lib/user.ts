import { prisma } from "./prisma";

const LOCAL_USER_EMAIL = "emily.may.knox@gmail.com";

// Single local user for the MVP. Everything hangs off this row so that
// multi-tenant later is "add auth and stop hardcoding the email".
export async function getLocalUser() {
  const existing = await prisma.user.findUnique({
    where: { email: LOCAL_USER_EMAIL },
  });
  if (existing) return existing;
  return prisma.user.create({
    data: { name: "Emily Knox", email: LOCAL_USER_EMAIL },
  });
}
