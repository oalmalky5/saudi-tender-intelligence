import { companyProfileSchema } from "../src/lib/company/profile-schema";
import { prisma } from "../src/lib/prisma";

const PRIMARY_PROFILE_ID = "primary";

const demoProfile = companyProfileSchema.parse({
  companyName: "Nexa Digital Solutions",
  summary:
    "Nexa Digital Solutions designs and delivers custom software platforms, data dashboards, workflow automation, cloud modernization, and cybersecurity advisory services for government entities and regulated organizations.",
  services: [
    "Custom software development",
    "Data analytics and dashboards",
    "Workflow automation",
    "Cloud modernization",
    "Cybersecurity advisory",
  ],
  activities: [
    "Information technology consulting",
    "Software development",
    "Data and analytics",
    "Cybersecurity",
  ],
  industries: ["Government", "Technology", "Professional services"],
  targetGovernmentEntities: [],
  regions: ["Riyadh"],
  preferredKeywords: [
    "software",
    "digital platform",
    "data",
    "dashboard",
    "automation",
    "cybersecurity",
    "cloud",
  ],
  excludedKeywords: [
    "construction",
    "medical supplies",
    "building maintenance",
    "food supply",
  ],
  preferredOpportunityTypes: [],
});

async function main(): Promise<void> {
  const replace = process.argv.includes("--replace");
  const existingProfile = await prisma.companyProfile.findUnique({
    where: { id: PRIMARY_PROFILE_ID },
    select: { companyName: true },
  });

  if (existingProfile && !replace) {
    console.log(
      `Primary profile already belongs to "${existingProfile.companyName}". No changes made.`,
    );
    console.log("Run `npm run demo:seed -- --replace` to replace it intentionally.");
    return;
  }

  await prisma.companyProfile.upsert({
    where: { id: PRIMARY_PROFILE_ID },
    create: { id: PRIMARY_PROFILE_ID, ...demoProfile },
    update: demoProfile,
  });

  console.log(`Demo profile ready: ${demoProfile.companyName}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
