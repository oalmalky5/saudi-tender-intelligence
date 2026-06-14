import { z } from "zod";

export const tenderChatCitationSchema = z.object({
  tenderId: z.string().trim().min(1),
  claim: z.string().trim().min(1).max(2_000),
});

export const tenderChatAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(8_000),
  unsupported: z.boolean(),
  caveats: z.array(z.string().trim().min(1).max(2_000)).max(8),
  citations: z.array(tenderChatCitationSchema).max(20),
});

export type TenderChatAnswer = z.infer<typeof tenderChatAnswerSchema>;

export const tenderChatAnswerJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    unsupported: { type: "boolean" },
    caveats: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
    citations: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tenderId: { type: "string" },
          claim: { type: "string" },
        },
        required: ["tenderId", "claim"],
      },
    },
  },
  required: ["answer", "unsupported", "caveats", "citations"],
} as const;
