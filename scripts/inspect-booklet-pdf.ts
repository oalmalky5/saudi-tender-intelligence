import { readFile } from "node:fs/promises";

import { extractPdfPages, isPdf } from "../src/lib/booklets/extract-pdf";
import { hashBooklet } from "../src/lib/booklets/storage";

async function main(): Promise<void> {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(
      "Provide a PDF path: npm run booklet:inspect -- /path/to/booklet.pdf",
    );
  }

  const bytes = new Uint8Array(await readFile(filePath));
  if (!isPdf(bytes)) {
    throw new Error("The supplied file is not a PDF.");
  }

  const extraction = await extractPdfPages(bytes);
  console.log(
    JSON.stringify(
      {
        sha256: hashBooklet(bytes),
        sizeBytes: bytes.length,
        pageCount: extraction.pageCount,
        extractedCharacters: extraction.extractedCharacters,
        averageCharactersPerPage: Math.round(
          extraction.extractedCharacters / extraction.pageCount,
        ),
        requiresOcr: extraction.requiresOcr,
        pageCharacterCounts: extraction.pages.map((page) => ({
          pageNumber: page.pageNumber,
          characterCount: page.characterCount,
        })),
        firstPages: extraction.pages.slice(0, 3).map((page) => ({
          pageNumber: page.pageNumber,
          preview: page.text.slice(0, 500),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
