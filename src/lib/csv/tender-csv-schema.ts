import { createHash } from "node:crypto";
import { z } from "zod";

export const MAX_CSV_BYTES = 5 * 1024 * 1024;
export const MAX_CSV_ROWS = 2_000;

export const csvTenderFields = [
  "referenceNumber",
  "tenderNumber",
  "titleArabic",
  "titleEnglish",
  "descriptionArabic",
  "descriptionEnglish",
  "agencyNameArabic",
  "branchNameArabic",
  "tenderTypeNameArabic",
  "tenderStatusNameArabic",
  "activityNameArabic",
  "executionRegionArabic",
  "executionCityArabic",
  "publishedAt",
  "submissionDeadline",
  "sourceUrl",
] as const;

export type CsvTenderField = (typeof csvTenderFields)[number];

const headerAliases: Record<CsvTenderField, string[]> = {
  referenceNumber: ["referencenumber", "reference", "ref", "رقمالمرجع"],
  tenderNumber: ["tendernumber", "رقمالمنافسة"],
  titleArabic: ["titlearabic", "arabictitle", "tendername", "العنوان", "اسمالمنافسة"],
  titleEnglish: ["titleenglish", "englishtitle"],
  descriptionArabic: ["descriptionarabic", "arabicdescription", "الوصف"],
  descriptionEnglish: ["descriptionenglish", "englishdescription"],
  agencyNameArabic: ["agencynamearabic", "agencyname", "agency", "الجهة"],
  branchNameArabic: ["branchnamearabic", "branchname", "branch", "الفرع"],
  tenderTypeNameArabic: ["tendertypenamearabic", "tendertype", "نوعالمنافسة"],
  tenderStatusNameArabic: ["tenderstatusnamearabic", "tenderstatus", "الحالة"],
  activityNameArabic: ["activitynamearabic", "activity", "النشاط"],
  executionRegionArabic: ["executionregionarabic", "region", "المنطقة"],
  executionCityArabic: ["executioncityarabic", "city", "المدينة"],
  publishedAt: ["publishedat", "publicationdate", "publisheddate", "تاريخالنشر"],
  submissionDeadline: ["submissiondeadline", "deadline", "آخرموعدللتقديم"],
  sourceUrl: ["sourceurl", "url", "link", "الرابط"],
};

function normalizeHeader(header: string): string {
  return header.toLocaleLowerCase().replace(/[\s_-]+/g, "").trim();
}

export function mapCsvHeaders(headers: string[]): Partial<Record<CsvTenderField, string>> {
  const normalizedHeaders = new Map(
    headers.map((header) => [normalizeHeader(header), header]),
  );
  const mapping: Partial<Record<CsvTenderField, string>> = {};

  for (const field of csvTenderFields) {
    const match = headerAliases[field]
      .map(normalizeHeader)
      .map((alias) => normalizedHeaders.get(alias))
      .find(Boolean);
    if (match) {
      mapping[field] = match;
    }
  }

  return mapping;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalDate(value: unknown): string | null {
  const text = optionalText(value);
  if (!text) {
    return null;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString();
}

export const csvTenderSchema = z.object({
  referenceNumber: z.string().trim().min(1).max(200),
  tenderNumber: z.string().trim().max(200).nullable(),
  titleArabic: z.string().trim().min(1).max(4_000),
  titleEnglish: z.string().trim().max(4_000).nullable(),
  descriptionArabic: z.string().trim().max(30_000).nullable(),
  descriptionEnglish: z.string().trim().max(30_000).nullable(),
  agencyNameArabic: z.string().trim().min(1).max(4_000),
  branchNameArabic: z.string().trim().max(4_000).nullable(),
  tenderTypeNameArabic: z.string().trim().min(1).max(1_000),
  tenderStatusNameArabic: z.string().trim().max(1_000).nullable(),
  activityNameArabic: z.string().trim().max(4_000).nullable(),
  executionRegionArabic: z.string().trim().max(1_000).nullable(),
  executionCityArabic: z.string().trim().max(1_000).nullable(),
  publishedAt: z.string().datetime(),
  submissionDeadline: z.string().datetime().nullable(),
  sourceUrl: z.string().url().nullable(),
});

export type CsvTender = z.infer<typeof csvTenderSchema>;

export function normalizeCsvTenderRow(
  row: Record<string, string>,
  mapping: Partial<Record<CsvTenderField, string>>,
): unknown {
  const read = (field: CsvTenderField) =>
    mapping[field] ? row[mapping[field] as string] : undefined;

  return {
    referenceNumber: requiredText(read("referenceNumber")),
    tenderNumber: optionalText(read("tenderNumber")),
    titleArabic: requiredText(read("titleArabic")),
    titleEnglish: optionalText(read("titleEnglish")),
    descriptionArabic: optionalText(read("descriptionArabic")),
    descriptionEnglish: optionalText(read("descriptionEnglish")),
    agencyNameArabic: requiredText(read("agencyNameArabic")),
    branchNameArabic: optionalText(read("branchNameArabic")),
    tenderTypeNameArabic: requiredText(read("tenderTypeNameArabic")),
    tenderStatusNameArabic: optionalText(read("tenderStatusNameArabic")),
    activityNameArabic: optionalText(read("activityNameArabic")),
    executionRegionArabic: optionalText(read("executionRegionArabic")),
    executionCityArabic: optionalText(read("executionCityArabic")),
    publishedAt: optionalDate(read("publishedAt")),
    submissionDeadline: optionalDate(read("submissionDeadline")),
    sourceUrl: optionalText(read("sourceUrl")),
  };
}

export function csvSourceTenderId(referenceNumber: string): number {
  const digest = createHash("sha256").update(referenceNumber).digest();
  return -(digest.readUInt32BE(0) & 0x7fffffff || 1);
}
