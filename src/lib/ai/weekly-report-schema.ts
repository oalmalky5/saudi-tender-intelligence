import { z } from "zod";

const conciseText = z.string().trim().min(1).max(2_000);
const conciseList = z.array(conciseText).max(8);

export const weeklyReportCategorySchema = z.enum([
  "TOP_RELEVANT",
  "CLOSING_SOON",
  "HIGH_RISK",
  "IGNORE",
]);

export const weeklyReportTenderReviewSchema = z.object({
  tenderId: z.string().trim().min(1),
  categories: z.array(weeklyReportCategorySchema).min(1).max(4),
  relevanceScore: z.number().int().min(0).max(100),
  rationale: conciseText,
  risks: conciseList,
  recommendedAction: conciseText,
});

export const weeklyTenderReportSchema = z.object({
  executiveSummary: conciseText,
  marketSignals: conciseList,
  recommendedActions: conciseList,
  limitations: conciseList,
  tenderReviews: z.array(weeklyReportTenderReviewSchema).max(20),
});

export type WeeklyTenderReportContent = z.infer<typeof weeklyTenderReportSchema>;

const stringArray = {
  type: "array",
  maxItems: 8,
  items: { type: "string" },
} as const;

export const weeklyTenderReportJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "string" },
    marketSignals: stringArray,
    recommendedActions: stringArray,
    limitations: stringArray,
    tenderReviews: {
      type: "array",
      minItems: 0,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tenderId: { type: "string" },
          categories: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: {
              type: "string",
              enum: ["TOP_RELEVANT", "CLOSING_SOON", "HIGH_RISK", "IGNORE"],
            },
          },
          relevanceScore: { type: "integer", minimum: 0, maximum: 100 },
          rationale: { type: "string" },
          risks: stringArray,
          recommendedAction: { type: "string" },
        },
        required: [
          "tenderId",
          "categories",
          "relevanceScore",
          "rationale",
          "risks",
          "recommendedAction",
        ],
      },
    },
  },
  required: [
    "executiveSummary",
    "marketSignals",
    "recommendedActions",
    "limitations",
    "tenderReviews",
  ],
} as const;
