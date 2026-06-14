import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session-core";

import { proxy } from "./proxy";

test("proxy redirects anonymous private-route requests to sign in", async () => {
  const response = await proxy(new NextRequest("http://localhost/company"));

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get("location"),
    "http://localhost/sign-in?next=%2Fcompany",
  );
});

test("proxy allows a valid signed workspace session", async () => {
  const token = await createSessionToken({
    userId: "user-one",
    workspaceId: "workspace-one",
    email: "user@example.com",
    name: "User One",
  });
  const request = new NextRequest("http://localhost/company", {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  });

  const response = await proxy(request);
  assert.equal(response.status, 200);
});
