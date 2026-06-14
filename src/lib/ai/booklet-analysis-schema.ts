import { z } from "zod";

const citationSchema = z.object({
  citationId: z.string().trim().min(1).max(40),
  pageNumber: z.number().int().positive(),
  excerpt: z.string().trim().min(1).max(800),
});

const findingSchema = z.object({
  statement: z.string().trim().min(1).max(3_000),
  sourceType: z.enum(["TENDER_SPECIFIC", "STANDARD_BOILERPLATE", "UNCLEAR"]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  citations: z.array(citationSchema).min(1).max(3),
});

const findings = z.array(findingSchema).max(8);

export const bookletAnalysisSchema = z.object({
  executiveSummary: z.array(findingSchema).max(5),
  scopeAndDeliverables: findings,
  eligibilityRequirements: findings,
  licensesCertificatesDocuments: findings,
  staffingQualifications: findings,
  submissionEvaluation: findings,
  guaranteesPenaltiesRisks: findings,
  localContentRequirements: findings,
  questionsUnclearPoints: findings,
  companyFitNotes: findings,
  standardBoilerplate: findings,
});

export type BookletAnalysisContent = z.infer<typeof bookletAnalysisSchema>;
export type BookletFinding = z.infer<typeof findingSchema>;

const citationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    citationId: { type: "string" },
  },
  required: ["citationId"],
} as const;

const findingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    statement: { type: "string" },
    sourceType: {
      type: "string",
      enum: ["TENDER_SPECIFIC", "STANDARD_BOILERPLATE", "UNCLEAR"],
    },
    confidence: {
      type: "string",
      enum: ["HIGH", "MEDIUM", "LOW"],
    },
    citations: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: citationJsonSchema,
    },
  },
  required: ["statement", "sourceType", "confidence", "citations"],
} as const;

const findingsJsonSchema = {
  type: "array",
  maxItems: 8,
  items: findingJsonSchema,
} as const;

export const bookletAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: {
      type: "array",
      maxItems: 5,
      items: findingJsonSchema,
    },
    scopeAndDeliverables: findingsJsonSchema,
    eligibilityRequirements: findingsJsonSchema,
    licensesCertificatesDocuments: findingsJsonSchema,
    staffingQualifications: findingsJsonSchema,
    submissionEvaluation: findingsJsonSchema,
    guaranteesPenaltiesRisks: findingsJsonSchema,
    localContentRequirements: findingsJsonSchema,
    questionsUnclearPoints: findingsJsonSchema,
    companyFitNotes: findingsJsonSchema,
    standardBoilerplate: findingsJsonSchema,
  },
  required: [
    "executiveSummary",
    "scopeAndDeliverables",
    "eligibilityRequirements",
    "licensesCertificatesDocuments",
    "staffingQualifications",
    "submissionEvaluation",
    "guaranteesPenaltiesRisks",
    "localContentRequirements",
    "questionsUnclearPoints",
    "companyFitNotes",
    "standardBoilerplate",
  ],
} as const;
