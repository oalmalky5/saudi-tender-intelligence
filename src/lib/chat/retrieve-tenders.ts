import type { Prisma } from "../../generated/prisma/client";
import { scoreTenderMatch } from "@/lib/matching/score-tender";
import { prisma } from "@/lib/prisma";

import {
  MAX_CHAT_TENDERS,
  type TenderChatRetrievalPlan,
} from "./retrieval-plan";

const tenderSelect = {
  id: true,
  referenceNumber: true,
  tenderNumber: true,
  titleArabic: true,
  titleEnglish: true,
  descriptionArabic: true,
  descriptionEnglish: true,
  agencyNameArabic: true,
  branchNameArabic: true,
  tenderTypeNameArabic: true,
  tenderStatusNameArabic: true,
  activityNameArabic: true,
  classificationFieldArabic: true,
  executionRegionArabic: true,
  executionCityArabic: true,
  publishedAt: true,
  submissionDeadline: true,
  documentPrice: true,
  initialGuaranteeRequired: true,
  finalGuaranteePercentage: true,
  insuranceRequired: true,
  localContentRequirementsArabic: true,
  detailEnrichmentStatus: true,
  updatedAt: true,
} satisfies Prisma.TenderSelect;

export async function retrieveTendersForChat(
  plan: TenderChatRetrievalPlan,
  companyProfileId = "primary",
  workspaceId = "primary-workspace",
  now = new Date(),
) {
  const profile = plan.requiresCompanyProfile
    ? await prisma.companyProfile.findUnique({ where: { id: companyProfileId } })
    : null;

  if (plan.mode === "company_fit") {
    if (!profile) {
      return { tenders: [], profile: null, limitation: "No company profile exists." };
    }

    const tenders = await prisma.tender.findMany({
      where: { decisions: { none: { workspaceId, status: "IGNORED" } } },
      orderBy: { publishedAt: "desc" },
      take: 120,
      select: tenderSelect,
    });
    const ranked = tenders
      .map((tender) => ({
        ...tender,
        deterministicMatch: scoreTenderMatch(profile, tender),
      }))
      .filter((tender) => tender.deterministicMatch.hasDirectScopeMatch)
      .sort(
        (left, right) =>
          right.deterministicMatch.score - left.deterministicMatch.score,
      )
      .slice(0, MAX_CHAT_TENDERS);

    return {
      tenders: ranked,
      profile,
      limitation:
        ranked.length === 0
          ? "No credible direct-scope matches were found among the latest 120 non-ignored tenders. Contextual overlap such as public-sector procurement, SME preference, geography, or helping another bidder does not count as company fit."
          : null,
    };
  }

  let where: Prisma.TenderWhereInput = {
    decisions: { none: { workspaceId, status: "IGNORED" } },
  };
  let orderBy: Prisma.TenderOrderByWithRelationInput[] = [
    { publishedAt: "desc" },
  ];

  if (plan.mode === "reference") {
    where = { referenceNumber: { in: plan.referenceNumbers } };
  } else if (plan.mode === "closing_soon" && plan.daysUntilDeadline !== null) {
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + plan.daysUntilDeadline);
    where = {
      AND: [
        where,
        { submissionDeadline: { gte: now, lte: deadline } },
      ],
    };
    orderBy = [{ submissionDeadline: "asc" }];
  } else if (plan.mode === "keyword") {
    where = {
      AND: [
        where,
        {
          OR: plan.queryTerms.flatMap((term) => [
            { titleArabic: { contains: term, mode: "insensitive" as const } },
            { titleEnglish: { contains: term, mode: "insensitive" as const } },
            { descriptionArabic: { contains: term, mode: "insensitive" as const } },
            { descriptionEnglish: { contains: term, mode: "insensitive" as const } },
            { agencyNameArabic: { contains: term, mode: "insensitive" as const } },
            { activityNameArabic: { contains: term, mode: "insensitive" as const } },
            { executionRegionArabic: { contains: term, mode: "insensitive" as const } },
          ]),
        },
      ],
    };
  }

  const tenders = await prisma.tender.findMany({
    where,
    orderBy,
    take: MAX_CHAT_TENDERS,
    select: tenderSelect,
  });

  return { tenders, profile, limitation: null };
}
