import { hashPassword } from "../src/lib/auth/password";
import { prisma } from "../src/lib/prisma";

const email = process.env.DEMO_USER_EMAIL ?? "demo@etimad.local";
const password = process.env.DEMO_USER_PASSWORD ?? "demo12345";

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.DEMO_USER_PASSWORD) {
    throw new Error("DEMO_USER_PASSWORD is required in production.");
  }

  const user = await prisma.user.upsert({
    where: { email: email.toLocaleLowerCase() },
    create: {
      id: "primary-user",
      email: email.toLocaleLowerCase(),
      name: "Demo User",
      passwordHash: await hashPassword(password),
    },
    update: {
      name: "Demo User",
      passwordHash: await hashPassword(password),
    },
  });

  await prisma.workspace.upsert({
    where: { userId: user.id },
    create: {
      id: "primary-workspace",
      userId: user.id,
      name: "Catalyft Demo Workspace",
      isDemo: true,
    },
    update: {
      name: "Catalyft Demo Workspace",
      isDemo: true,
    },
  });

  console.log(`Demo account ready: ${email}`);
  if (process.env.NODE_ENV !== "production" && !process.env.DEMO_USER_PASSWORD) {
    console.log("Local-only default password: demo12345");
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
