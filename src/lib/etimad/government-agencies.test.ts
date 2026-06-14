import assert from "node:assert/strict";
import test from "node:test";

import { fetchEtimadGovernmentAgencies } from "./government-agencies";

test("validates Etimad government agency lookup records", async () => {
  const agencies = await fetchEtimadGovernmentAgencies(
    async () =>
      new Response(
        JSON.stringify([
          {
            govAgencyCode: 0,
            agencyCode: "013001000000",
            nameArabic: "وزارة الاستثمار",
            nameEnglish: null,
            isOldSystem: false,
          },
        ]),
        { headers: { "content-type": "application/json" } },
      ),
  );

  assert.equal(agencies[0].nameArabic, "وزارة الاستثمار");
});
