import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTenderOrderBy,
  buildTenderWhere,
  parseTenderSearchParams,
} from "./search";

test("normalizes invalid tender search parameters", () => {
  const search = parseTenderSearchParams({
    q: "  تقنية  ",
    deadline: "invalid",
    sort: "invalid",
    page: "-2",
  });

  assert.equal(search.q, "تقنية");
  assert.equal(search.deadline, "any");
  assert.equal(search.sort, "published-desc");
  assert.equal(search.page, 1);
});

test("builds keyword, exact-filter, and closing-soon conditions", () => {
  const now = new Date("2026-06-12T12:00:00.000Z");
  const where = buildTenderWhere(
    {
      q: "تقنية",
      agency: "جهة",
      activity: "",
      region: "الرياض",
      status: "",
      deadline: "7",
      sort: "published-desc",
      page: 1,
    },
    now,
  );

  assert.deepEqual(where.AND?.at(-1), {
    submissionDeadline: {
      gte: now,
      lte: new Date("2026-06-19T12:00:00.000Z"),
    },
  });
  assert.deepEqual(where.AND?.slice(1, 3), [
    { agencyNameArabic: "جهة" },
    { executionRegionArabic: "الرياض" },
  ]);
});

test("sorts missing deadlines last", () => {
  assert.deepEqual(buildTenderOrderBy("deadline-asc"), [
    { submissionDeadline: { sort: "asc", nulls: "last" } },
  ]);
});
