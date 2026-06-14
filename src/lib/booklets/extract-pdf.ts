import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const MAX_BOOKLET_BYTES = 25 * 1024 * 1024;
export const MIN_AVERAGE_PAGE_CHARACTERS = 80;

export type ExtractedBookletPage = {
  pageNumber: number;
  text: string;
  characterCount: number;
};

export type ExtractedBooklet = {
  pages: ExtractedBookletPage[];
  pageCount: number;
  extractedCharacters: number;
  requiresOcr: boolean;
};

export function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  );
}

export function assessOcrRequirement(
  pages: Array<{ characterCount: number }>,
): boolean {
  if (pages.length === 0) {
    return true;
  }

  const extractedCharacters = pages.reduce(
    (total, page) => total + page.characterCount,
    0,
  );

  return extractedCharacters / pages.length < MIN_AVERAGE_PAGE_CHARACTERS;
}

export async function extractPdfPages(
  bytes: Uint8Array,
): Promise<ExtractedBooklet> {
  const document = await getDocument({
    // pdfjs may transfer and detach the supplied ArrayBuffer. Preserve the
    // caller's bytes for hashing, persistence, and later validation.
    data: bytes.slice(),
    useSystemFonts: true,
  }).promise;
  const pages: ExtractedBookletPage[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    pages.push({
      pageNumber,
      text,
      characterCount: text.length,
    });
  }

  const extractedCharacters = pages.reduce(
    (total, page) => total + page.characterCount,
    0,
  );

  return {
    pages,
    pageCount: document.numPages,
    extractedCharacters,
    requiresOcr: assessOcrRequirement(pages),
  };
}
