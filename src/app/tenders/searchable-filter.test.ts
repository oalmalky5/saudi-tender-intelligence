import assert from "node:assert/strict";
import test from "node:test";

import { uniqueSearchableFilterOptions } from "@/lib/tenders/searchable-filter-options";

test("removes duplicate searchable filter values", () => {
  const options = uniqueSearchableFilterOptions([
    { label: "Vision Realization Office", value: "مكتب تحقيق الرؤية" },
    { label: "Vision Realization Office", value: "مكتب تحقيق الرؤية" },
    { label: "Investment", value: "الاستثمار" },
  ]);

  assert.deepEqual(options, [
    { label: "Vision Realization Office", value: "مكتب تحقيق الرؤية" },
    { label: "Investment", value: "الاستثمار" },
  ]);
});
