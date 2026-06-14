import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "./password";

test("hashes passwords with a unique salt and verifies the correct password", async () => {
  const first = await hashPassword("a-secure-demo-password");
  const second = await hashPassword("a-secure-demo-password");

  assert.notEqual(first, second);
  assert.equal(await verifyPassword("a-secure-demo-password", first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
});
