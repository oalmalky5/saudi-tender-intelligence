import assert from "node:assert/strict";
import test from "node:test";

import { selectAiMatchingCandidates } from "./select-ai-candidates";
import type { MatchProfile, MatchTender } from "./score-tender";

const profile: MatchProfile = {
  services: ["strategy"],
  activities: [],
  industries: [],
  targetGovernmentEntities: [],
  regions: [],
  preferredKeywords: [],
  excludedKeywords: [],
  preferredOpportunityTypes: [],
};

function tender(titleArabic: string): MatchTender & { id: string } {
  return {
    id: titleArabic,
    titleArabic,
    descriptionArabic: null,
    agencyNameArabic: "Agency",
    activityNameArabic: null,
    classificationFieldArabic: null,
    executionRegionArabic: null,
    tenderTypeNameArabic: "Public tender",
    submissionDeadline: null,
    detailEnrichmentStatus: "pending",
  };
}

test("prioritizes positive deterministic candidates and respects the limit", () => {
  const selected = selectAiMatchingCandidates(
    profile,
    [tender("strategy one"), tender("strategy two"), tender("unrelated")],
    1,
  );

  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.deterministicMatch.score, 10);
});

test("fills remaining slots with recent exploration candidates", () => {
  const selected = selectAiMatchingCandidates(
    profile,
    [tender("unrelated one"), tender("unrelated two")],
    2,
  );

  assert.equal(selected.length, 2);
  assert.deepEqual(
    selected.map(({ tender: selectedTender }) => selectedTender.id),
    ["unrelated one", "unrelated two"],
  );
});
