import { z } from "zod";

import type { PrismaClient } from "@/generated/prisma/client";

const ETIMAD_AGENCIES_URL =
  "https://tenders.etimad.sa/Tender/GetAllAgenciesAsync";

export const etimadGovernmentAgencySchema = z.object({
  govAgencyCode: z.number().int(),
  agencyCode: z.string().min(1),
  nameArabic: z.string().min(1),
  nameEnglish: z.string().nullable(),
  isOldSystem: z.boolean(),
});

export const etimadGovernmentAgenciesSchema = z.array(
  etimadGovernmentAgencySchema,
);

export type EtimadGovernmentAgency = z.infer<
  typeof etimadGovernmentAgencySchema
>;

export async function fetchEtimadGovernmentAgencies(
  fetcher: typeof fetch = fetch,
): Promise<EtimadGovernmentAgency[]> {
  const response = await fetcher(ETIMAD_AGENCIES_URL, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ar-SA,ar;q=0.9,en;q=0.8",
      Referer: "https://tenders.etimad.sa/Tender/AllTendersForVisitor",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/137 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Etimad agency lookup failed with ${response.status} ${response.statusText}.`,
    );
  }

  return etimadGovernmentAgenciesSchema.parse(await response.json());
}

export async function syncEtimadGovernmentAgencies(
  db: PrismaClient,
  observedAt = new Date(),
): Promise<{ fetched: number; created: number }> {
  const agencies = await fetchEtimadGovernmentAgencies();
  const result = await db.governmentAgency.createMany({
    data: agencies.map((agency) => ({
      agencyCode: agency.agencyCode,
      govAgencyCode: agency.govAgencyCode,
      nameArabic: agency.nameArabic.trim(),
      isOldSystem: agency.isOldSystem,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
    })),
    skipDuplicates: true,
  });

  await db.governmentAgency.updateMany({
    where: { agencyCode: { in: agencies.map((agency) => agency.agencyCode) } },
    data: { lastSeenAt: observedAt },
  });

  return { fetched: agencies.length, created: result.count };
}
