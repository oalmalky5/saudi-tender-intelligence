import assert from "node:assert/strict";
import test from "node:test";

import { createSessionToken, verifySessionToken } from "./session-core";

test("creates and verifies a signed workspace session", async () => {
  const token = await createSessionToken({
    userId: "user-one",
    workspaceId: "workspace-one",
    email: "user@example.com",
    name: "User One",
  });
  const session = await verifySessionToken(token);

  assert.equal(session?.userId, "user-one");
  assert.equal(session?.workspaceId, "workspace-one");
});

test("rejects a tampered workspace session", async () => {
  const token = await createSessionToken({
    userId: "user-one",
    workspaceId: "workspace-one",
    email: "user@example.com",
    name: "User One",
  });
  const [payload, signature] = token.split(".");
  const tampered = `${payload.slice(0, -1)}x.${signature}`;

  assert.equal(await verifySessionToken(tampered), null);
});
