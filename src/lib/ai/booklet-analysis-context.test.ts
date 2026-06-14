import assert from "node:assert/strict";
import test from "node:test";

import {
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

test("returns a small positive conservative estimate", () => {
  const estimate = estimateBookletAnalysisCostUsd([
    page(1, "a".repeat(10_000)),
  ]);

  assert.ok(estimate > 0);
  assert.ok(estimate < 1);
});
