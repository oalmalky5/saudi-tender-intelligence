export const MAX_ANALYZED_BOOKLET_PAGES = 30;
export const MAX_ANALYZED_BOOKLET_CHARACTERS = 100_000;

type BookletPage = {
  pageNumber: number;
  text: string;
  characterCount: number;
};

type CompanyProfileInput = {
  companyName: string;
  summary: string;
  services: string[];
  activities: string[];
  industries: string[];
  targetGovernmentEntities: string[];
  regions: string[];
  preferredKeywords: string[];
  excludedKeywords: string[];
} | null;

const retrievalTerms = [
  "نطاق",
  "الأعمال",
  "الخدمات",
  "المخرجات",
  "التسليمات",
  "التأهيل",
  "المؤهلات",
  "الخبرة",
  "الترخيص",
  "الشهادة",
  "المستندات",
  "الوثائق",
  "الفريق",
  "الموظفين",
  "السيرة الذاتية",
  "اللغة",
  "التقييم",
  "الدرجات",
  "العرض الفني",
  "العرض المالي",
  "التقديم",
  "الضمان",
  "الغرامة",
  "المخاطر",
  "المحتوى المحلي",
  "scope",
  "deliverables",
  "eligibility",
  "license",
  "certificate",
  "staff",
  "evaluation",
  "guarantee",
  "penalty",
  "local content",
];

function pageScore(page: BookletPage): number {
  const normalized = page.text.toLocaleLowerCase();
  return retrievalTerms.reduce(
    (score, term) => score + (normalized.includes(term) ? 1 : 0),
    0,
  );
}

export function selectBookletPages(pages: BookletPage[]): BookletPage[] {
  const firstPages = pages.slice(0, 5);
  const firstPageNumbers = new Set(firstPages.map((page) => page.pageNumber));
  const ranked = pages
    .filter((page) => !firstPageNumbers.has(page.pageNumber))
    .map((page) => ({ page, score: pageScore(page) }))
    .sort(
      (left, right) =>
        right.score - left.score || left.page.pageNumber - right.page.pageNumber,
    );
  const selected = [...firstPages];
  let totalCharacters = selected.reduce(
    (total, page) => total + page.characterCount,
    0,
  );

  for (const { page } of ranked) {
    if (selected.length >= MAX_ANALYZED_BOOKLET_PAGES) {
      break;
    }
    if (totalCharacters + page.characterCount > MAX_ANALYZED_BOOKLET_CHARACTERS) {
      continue;
    }
    selected.push(page);
    totalCharacters += page.characterCount;
  }

  return selected.sort((left, right) => left.pageNumber - right.pageNumber);
}

export function estimateBookletAnalysisCostUsd(
  pages: BookletPage[],
  expectedOutputTokens = 5_000,
): number {
  const characters = pages.reduce(
    (total, page) => total + page.characterCount,
    0,
  );
  const conservativeInputTokens = Math.ceil(characters / 2) + 2_000;
  return (conservativeInputTokens * 0.25 + expectedOutputTokens * 2) / 1_000_000;
}

export function buildBookletAnalysisContext(
  booklet: {
    originalName: string;
    sha256: string;
    pageCount: number;
  },
  pages: BookletPage[],
  companyProfile: CompanyProfileInput,
) {
  return {
    purpose:
      "Create a cited English qualification review from selected conditions-booklet pages.",
    document: booklet,
    selectionNotice: {
      selectedPages: pages.map((page) => page.pageNumber),
      limitation:
        "Only the supplied pages are available to this analysis. Absence from these pages does not prove absence from the full booklet.",
    },
    companyProfile,
    pages: pages.map((page) => ({
      pageNumber: page.pageNumber,
      text: page.text,
    })),
  };
}
