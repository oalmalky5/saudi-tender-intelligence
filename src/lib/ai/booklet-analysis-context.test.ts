import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBookletAnalysisContext,
  buildBookletCitationCatalog,
  estimateBookletAnalysisCostUsd,
  selectBookletPages,
} from "./booklet-analysis-context";

function page(pageNumber: number, text: string) {
  return { pageNumber, text, characterCount: text.length };
}

test("selects first pages and relevant later pages within the cap", () => {
  const pages = [
    page(1, "cover"),
    page(2, "intro"),
    page(3, "intro"),
    page(4, "intro"),
    page(5, "intro"),
    page(6, "unrelated"),
    page(7, "نطاق الأعمال والتقييم والضمان"),
  ];

  assert.deepEqual(
    selectBookletPages(pages).map((selected) => selected.pageNumber),
    [1, 2, 3, 4, 5, 6, 7],
  );
});

test("selects the full booklet when every page fits within both caps", () => {
  const pages = Array.from({ length: 35 }, (_, index) => ({
    pageNumber: index + 1,
    text: "نص قصير",
    characterCount: 8,
  }));

  assert.deepEqual(
    selectBookletPages(pages).map((page) => page.pageNumber),
    pages.map((page) => page.pageNumber),
  );
});

test("returns a small positive conservative estimate", () => {
  const estimate = estimateBookletAnalysisCostUsd([
    page(1, "a".repeat(10_000)),
  ]);

  assert.ok(estimate > 0);
  assert.ok(estimate < 1);
});

test("builds stable exact citation snippets without changing source text", () => {
  const text = `${"كلمة ".repeat(100)}نهاية`;
  const catalog = buildBookletCitationCatalog([page(7, text)]);

  assert.ok(catalog.length > 1);
  assert.equal(catalog[0].citationId, "p007-s001");
  for (const citation of catalog) {
    assert.equal(citation.pageNumber, 7);
    assert.ok(text.includes(citation.excerpt));
  }
});

test("uses the citation catalog instead of raw page text in AI context", () => {
  const context = buildBookletAnalysisContext(
    { originalName: "booklet.pdf", sha256: "hash", pageCount: 1 },
    [page(1, "يجب تقديم العرض الفني")],
    null,
  );

  assert.equal("pages" in context, false);
  assert.deepEqual(context.citationCatalog, [
    {
      citationId: "p001-s001",
      pageNumber: 1,
      excerpt: "يجب تقديم العرض الفني",
    },
  ]);
});
