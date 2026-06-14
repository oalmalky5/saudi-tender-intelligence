import {
  buildBookletAnalysisContext,
  estimateBookletAnalysisCostUsd,
  selectBookletPages,
} from "../src/lib/ai/booklet-analysis-context";
import { evaluateBookletAnalysis } from "../src/lib/ai/evaluate-booklet-analysis";
import {
  BOOKLET_ANALYSIS_PROMPT_VERSION,
  BOOKLET_ANALYSIS_SCHEMA_VERSION,
  generateBookletAnalysis,
} from "../src/lib/ai/generate-booklet-analysis";
import { prisma } from "../src/lib/prisma";

async function main(): Promise<void> {
  const requestedId = process.argv[2];
  const [booklet, profile] = await Promise.all([
    requestedId
      ? prisma.tenderBooklet.findUnique({
          where: { id: requestedId },
          include: {
            pages: { orderBy: { pageNumber: "asc" } },
            tender: { select: { referenceNumber: true, titleArabic: true } },
          },
        })
      : prisma.tenderBooklet.findFirst({
          orderBy: { createdAt: "desc" },
          include: {
            pages: { orderBy: { pageNumber: "asc" } },
            tender: { select: { referenceNumber: true, titleArabic: true } },
          },
        }),
    prisma.companyProfile.findUnique({ where: { id: "primary" } }),
  ]);

  if (!booklet) {
    throw new Error("No uploaded booklet was found.");
  }
  if (booklet.requiresOcr || booklet.extractionStatus !== "complete") {
    throw new Error("The selected booklet requires OCR or extraction review.");
  }

  const selectedPages = selectBookletPages(booklet.pages);
  console.log(
    `Analyzing ${booklet.originalName}: ${selectedPages.length}/${booklet.pageCount} pages, estimated cost $${estimateBookletAnalysisCostUsd(selectedPages).toFixed(6)}.`,
  );

  const generation = await generateBookletAnalysis(
    buildBookletAnalysisContext(booklet, selectedPages, profile),
  );
  const evaluation = evaluateBookletAnalysis(selectedPages, generation.content);

  if (!evaluation.passed) {
    console.log(JSON.stringify(generation.content, null, 2));
    console.log(
      JSON.stringify(
        {
          evaluation,
          usage: {
            model: generation.model,
            inputTokens: generation.inputTokens,
            outputTokens: generation.outputTokens,
            totalTokens: generation.totalTokens,
            estimatedCostUsd: generation.estimatedCostUsd,
          },
        },
        null,
        2,
      ),
    );
    throw new Error(
      `Booklet analysis failed deterministic checks: ${evaluation.issues.join(" ")}`,
    );
  }

  const stored = await prisma.tenderBookletAnalysis.create({
    data: {
      bookletId: booklet.id,
      companyProfileId: profile?.id ?? null,
      content: JSON.parse(JSON.stringify(generation.content)),
      model: generation.model,
      promptVersion: BOOKLET_ANALYSIS_PROMPT_VERSION,
      schemaVersion: BOOKLET_ANALYSIS_SCHEMA_VERSION,
      openaiResponseId: generation.openaiResponseId,
      inputTokens: generation.inputTokens,
      outputTokens: generation.outputTokens,
      totalTokens: generation.totalTokens,
      estimatedCostUsd: generation.estimatedCostUsd,
      sourceBookletSha256: booklet.sha256,
      sourceCompanyProfileUpdatedAt: profile?.updatedAt ?? null,
      analyzedPageNumbers: selectedPages.map((page) => page.pageNumber),
    },
  });

  console.log(JSON.stringify(generation.content, null, 2));
  console.log(
    JSON.stringify(
      {
        storedAnalysisId: stored.id,
        tenderReferenceNumber: booklet.tender.referenceNumber,
        selectedPages: selectedPages.map((page) => page.pageNumber),
        evaluation,
        usage: {
          model: generation.model,
          inputTokens: generation.inputTokens,
          outputTokens: generation.outputTokens,
          totalTokens: generation.totalTokens,
          estimatedCostUsd: generation.estimatedCostUsd,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
