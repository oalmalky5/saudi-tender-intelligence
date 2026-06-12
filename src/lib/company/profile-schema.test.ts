import assert from "node:assert/strict";
import test from "node:test";

import { companyProfileSchema, parseProfileList } from "./profile-schema";

test("parses comma and newline separated profile lists without duplicates", () => {
  assert.deepEqual(parseProfileList("Consulting, Strategy\nconsulting\nDelivery"), [
    "Consulting",
    "Strategy",
    "Delivery",
  ]);
});

test("requires a meaningful company name and summary", () => {
  const result = companyProfileSchema.safeParse({
    companyName: "A",
    summary: "Too short",
    services: [],
    activities: [],
    industries: [],
    targetGovernmentEntities: [],
    regions: [],
    preferredKeywords: [],
    excludedKeywords: [],
    preferredOpportunityTypes: [],
  });

  assert.equal(result.success, false);
});
