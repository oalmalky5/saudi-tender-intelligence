import { z } from "zod";

export const tenderTranslationSchema = z.object({
  titleEnglish: z.string().trim().min(1).max(2_000),
  descriptionEnglish: z.string().trim().min(1).max(20_000).nullable(),
});

export type TenderTranslationContent = z.infer<typeof tenderTranslationSchema>;

export const tenderTranslationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    titleEnglish: { type: "string" },
    descriptionEnglish: { type: ["string", "null"] },
  },
  required: ["titleEnglish", "descriptionEnglish"],
} as const;
