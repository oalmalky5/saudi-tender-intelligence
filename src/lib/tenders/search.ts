import type { Prisma } from "../../generated/prisma/client";

export const TENDERS_PER_PAGE = 24;

export type TenderSearchParams = {
  q?: string | string[];
  agency?: string | string[];
  activity?: string | string[];
  region?: string | string[];
  status?: string | string[];
  deadline?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

export type TenderSearch = {
  q: string;
  agency: string;
  activity: string;
  region: string;
  status: string;
  deadline: "any" | "7" | "30" | "missing";
  sort: "published-desc" | "deadline-asc" | "deadline-desc";
  page: number;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parseTenderSearchParams(
  params: TenderSearchParams,
): TenderSearch {
  const deadline = first(params.deadline);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page), 10);

  return {
    q: first(params.q).trim(),
    agency: first(params.agency),
    activity: first(params.activity),
    region: first(params.region),
    status: first(params.status),
    deadline: ["7", "30", "missing"].includes(deadline)
      ? (deadline as TenderSearch["deadline"])
      : "any",
    sort: ["deadline-asc", "deadline-desc"].includes(sort)
      ? (sort as TenderSearch["sort"])
      : "published-desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function buildTenderWhere(
  search: TenderSearch,
  now = new Date(),
): Prisma.TenderWhereInput {
  const conditions: Prisma.TenderWhereInput[] = [];

  if (search.q) {
    conditions.push({
      OR: [
        { titleArabic: { contains: search.q, mode: "insensitive" } },
        { descriptionArabic: { contains: search.q, mode: "insensitive" } },
        { agencyNameArabic: { contains: search.q, mode: "insensitive" } },
        { activityNameArabic: { contains: search.q, mode: "insensitive" } },
        { referenceNumber: { contains: search.q, mode: "insensitive" } },
        { tenderNumber: { contains: search.q, mode: "insensitive" } },
      ],
    });
  }

  if (search.agency) {
    conditions.push({ agencyNameArabic: search.agency });
  }
  if (search.activity) {
    conditions.push({ activityNameArabic: search.activity });
  }
  if (search.region) {
    conditions.push({ executionRegionArabic: search.region });
  }
  if (search.status) {
    conditions.push({ tenderStatusNameArabic: search.status });
  }

  if (search.deadline === "missing") {
    conditions.push({ submissionDeadline: null });
  } else if (search.deadline === "7" || search.deadline === "30") {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + Number(search.deadline));
    conditions.push({ submissionDeadline: { gte: now, lte: deadline } });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function buildTenderOrderBy(
  sort: TenderSearch["sort"],
): Prisma.TenderOrderByWithRelationInput[] {
  if (sort === "deadline-asc") {
    return [{ submissionDeadline: { sort: "asc", nulls: "last" } }];
  }

  if (sort === "deadline-desc") {
    return [{ submissionDeadline: { sort: "desc", nulls: "last" } }];
  }

  return [{ publishedAt: "desc" }, { referenceNumber: "asc" }];
}
