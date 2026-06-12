import { z } from "zod";

const profileListSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(50);

export const companyProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  summary: z.string().trim().min(20).max(4_000),
  services: profileListSchema,
  activities: profileListSchema,
  industries: profileListSchema,
  targetGovernmentEntities: profileListSchema,
  regions: profileListSchema,
  preferredKeywords: profileListSchema,
  excludedKeywords: profileListSchema,
  preferredOpportunityTypes: profileListSchema,
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

export function parseProfileList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const unique = new Map<string, string>();

  for (const item of value.split(/[\n,]+/)) {
    const trimmed = item.trim();
    if (trimmed) {
      const key = trimmed.toLocaleLowerCase();
      if (!unique.has(key)) {
        unique.set(key, trimmed);
      }
    }
  }

  return [...unique.values()];
}
