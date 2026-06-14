import assert from "node:assert/strict";
import test from "node:test";

import { scoreTenderMatch, type MatchProfile, type MatchTender } from "./score-tender";

const profile: MatchProfile = {
  services: ["digital transformation"],
  activities: ["Information technology"],
  industries: ["government"],
  targetGovernmentEntities: ["Digital Government Authority"],
  regions: ["Riyadh"],
  preferredKeywords: ["innovation"],
  excludedKeywords: ["construction"],
  preferredOpportunityTypes: ["Public tender"],
};

const tender: MatchTender = {
  titleArabic: "Digital transformation and innovation services",
  descriptionArabic: "Supporting government services",
  agencyNameArabic: "Digital Government Authority",
  activityNameArabic: "Information technology",
  classificationFieldArabic: null,
  executionRegionArabic: "Riyadh",
  tenderTypeNameArabic: "Public tender",
  submissionDeadline: new Date("2026-06-25T12:00:00.000Z"),
  detailEnrichmentStatus: "complete",
};

test("scores and explains a strong deterministic match", () => {
  const match = scoreTenderMatch(
    profile,
    tender,
    new Date("2026-06-12T12:00:00.000Z"),
  );

  assert.equal(match.score, 95);
  assert.equal(match.reasons.length, 7);
  assert.equal(match.hasDirectScopeMatch, true);
  assert.equal(match.directScopeScore, 50);
  assert.deepEqual(match.matchedTerms, [
    "innovation",
    "digital transformation",
    "government",
  ]);
});

test("strongly penalizes excluded terms", () => {
  const match = scoreTenderMatch(
    profile,
    { ...tender, titleArabic: `${tender.titleArabic} construction` },
    new Date("2026-06-12T12:00:00.000Z"),
  );

  assert.equal(match.score, 35);
  assert.equal(match.hasDirectScopeMatch, false);
  assert.match(match.concerns[0] ?? "", /Excluded terms found/);
});

test("does not invent a region match for an unenriched tender", () => {
  const match = scoreTenderMatch(profile, {
    ...tender,
    executionRegionArabic: null,
    detailEnrichmentStatus: "pending",
  });

  assert.equal(match.score, 85);
  assert.ok(match.concerns.includes("Region is unknown until public details are enriched."));
});

test("deadline urgency cannot create relevance by itself", () => {
  const match = scoreTenderMatch(
    {
      ...profile,
      services: [],
      activities: [],
      industries: [],
      targetGovernmentEntities: [],
      regions: [],
      preferredKeywords: [],
      preferredOpportunityTypes: [],
    },
    tender,
    new Date("2026-06-12T12:00:00.000Z"),
  );

  assert.equal(match.score, 0);
  assert.equal(match.hasDirectScopeMatch, false);
  assert.deepEqual(match.reasons, []);
});

test("short acronyms do not match inside unrelated words", () => {
  const match = scoreTenderMatch(
    { ...profile, services: ["CR"], activities: [], preferredKeywords: [] },
    {
      ...tender,
      titleArabic: "PCR kits and micron wrapping material",
      descriptionArabic: null,
      activityNameArabic: null,
    },
  );

  assert.equal(match.hasDirectScopeMatch, false);
  assert.equal(match.matchedTerms.includes("CR"), false);
});

test("contextual overlap alone does not establish company fit", () => {
  const match = scoreTenderMatch(
    {
      ...profile,
      services: [],
      activities: [],
      preferredKeywords: [],
      industries: ["healthcare"],
      targetGovernmentEntities: ["Program Medical Cities"],
      regions: ["Riyadh"],
    },
    {
      ...tender,
      titleArabic: "Supply and install intensive-care medical equipment",
      descriptionArabic: "SME preference applies",
      agencyNameArabic: "Program Medical Cities",
      activityNameArabic: "healthcare",
    },
  );

  assert.ok(match.score > 0);
  assert.equal(match.directScopeScore, 0);
  assert.equal(match.hasDirectScopeMatch, false);
});
