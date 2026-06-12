import assert from "node:assert/strict";
import test from "node:test";

import { etimadListPageSchema } from "./list-schema";

test("rejects an Etimad page when a required field has the wrong type", () => {
  const result = etimadListPageSchema.safeParse({
    data: [{ tenderId: "not-a-number" }],
    totalCount: 1,
    pageSize: 24,
    currentPage: 1,
    queryString: null,
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.deepEqual(result.error.issues[0]?.path, ["data", 0, "tenderId"]);
  }
});
