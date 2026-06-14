import assert from "node:assert/strict";
import test from "node:test";

import { hashBooklet } from "./storage";

test("booklet hashing is deterministic and content-sensitive", () => {
  const first = new TextEncoder().encode("first booklet");
  const second = new TextEncoder().encode("second booklet");

  assert.equal(hashBooklet(first), hashBooklet(first));
  assert.notEqual(hashBooklet(first), hashBooklet(second));
});
