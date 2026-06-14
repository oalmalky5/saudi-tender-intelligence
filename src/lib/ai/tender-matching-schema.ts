import { z } from "zod";

const conciseText = z.string().trim().min(1).max(2_000);
const conciseList = z.array(conciseText).max(5);

export const tenderAiMatchSchema = z.object({
  tenderId: z.string().trim().min(1),
  relevanceScore: z.number().int().min(0).max(100),
  whyMatches: conciseList,
  whyMayNotMatch: conciseList,
  whatToCheckNext: conciseList,
  recommendedAction: z.enum(["REVIEW", "SAVE", "IGNORE", "MORE_INFORMATION"]),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const tenderAiMatchingSchema = z.object({
  matches: z.array(tenderAiMatchSchema).min(1).max(10),
});

export type TenderAiMatchContent = z.infer<typeof tenderAiMatchSchema>;
export type TenderAiMatchingContent = z.infer<typeof tenderAiMatchingSchema>;

const stringArraySchema = {
  type: "array",
  maxItems: 5,
  items: { type: "string" },
} as const;

export const tenderAiMatchingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    matches: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tenderId: { type: "string" },
          relevanceScore: { type: "integer", minimum: 0, maximum: 100 },
          whyMatches: stringArraySchema,
          whyMayNotMatch: stringArraySchema,
          whatToCheckNext: stringArraySchema,
          recommendedAction: {
            type: "string",
            enum: ["REVIEW", "SAVE", "IGNORE", "MORE_INFORMATION"],
          },
          confidence: {
            type: "string",
            enum: ["HIGH", "MEDIUM", "LOW"],
          },
        },
        required: [
          "tenderId",
          "relevanceScore",
          "whyMatches",
          "whyMayNotMatch",
          "whatToCheckNext",
          "recommendedAction",
          "confidence",
        ],
      },
    },
  },
  required: ["matches"],
} as const;
