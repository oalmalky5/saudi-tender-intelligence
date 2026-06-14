import { tenderTranslationSchema, type TenderTranslationContent } from "@/lib/ai/tender-translation-schema";
import type { TenderTranslationSource } from "@/lib/ai/tender-translation-source";

export const AZURE_TRANSLATION_MODEL = "azure-translator-v3";
export const AZURE_TRANSLATION_VERSION = "azure-automatic-v1";

type AzureTranslationResponse = Array<{
  translations?: Array<{ text?: string; to?: string }>;
}>;

type AzureErrorResponse = {
  error?: { message?: string };
};

export type AzureTranslationResult = {
  content: TenderTranslationContent;
  characterCount: number;
};

export function azureTranslatorConfigured(): boolean {
  return Boolean(
    process.env.AZURE_TRANSLATOR_KEY && process.env.AZURE_TRANSLATOR_ENDPOINT,
  );
}

function endpointUrl(): string {
  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
  if (!endpoint) {
    throw new Error("AZURE_TRANSLATOR_ENDPOINT is not configured.");
  }
  const url = new URL("/translate", endpoint);
  url.searchParams.set("api-version", "3.0");
  url.searchParams.set("from", "ar");
  url.searchParams.set("to", "en");
  return url.toString();
}

export async function translateArabicTextsWithAzure(
  texts: string[],
  fetcher: typeof fetch = fetch,
): Promise<string[]> {
  if (texts.length === 0) {
    return [];
  }
  const key = process.env.AZURE_TRANSLATOR_KEY;
  if (!key) {
    throw new Error("AZURE_TRANSLATOR_KEY is not configured.");
  }

  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": key,
    "Content-Type": "application/json; charset=UTF-8",
  };
  if (
    process.env.AZURE_TRANSLATOR_REGION &&
    process.env.AZURE_TRANSLATOR_REGION.toLowerCase() !== "global"
  ) {
    headers["Ocp-Apim-Subscription-Region"] =
      process.env.AZURE_TRANSLATOR_REGION;
  }

  const response = await fetcher(endpointUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(texts.map((text) => ({ text }))),
  });
  const body = (await response.json()) as
    | AzureTranslationResponse
    | AzureErrorResponse;

  if (!response.ok) {
    const errorBody = body as AzureErrorResponse;
    throw new Error(
      errorBody.error?.message ??
        `Azure Translator request failed with status ${response.status}.`,
    );
  }

  const translations = (body as AzureTranslationResponse).map(
    (item) => item.translations?.find((translation) => translation.to === "en")?.text,
  );
  if (
    translations.length !== texts.length ||
    translations.some((translation) => !translation)
  ) {
    throw new Error("Azure Translator returned an incomplete response.");
  }
  return translations as string[];
}

export async function translateTenderSourceWithAzure(
  source: TenderTranslationSource,
): Promise<AzureTranslationResult> {
  const texts = [
    source.titleArabic,
    ...(source.descriptionArabic ? [source.descriptionArabic] : []),
  ];
  const translated = await translateArabicTextsWithAzure(texts);
  const content = tenderTranslationSchema.parse({
    titleEnglish: translated[0],
    descriptionEnglish: source.descriptionArabic ? translated[1] : null,
  });

  return {
    content,
    characterCount: texts.reduce((total, text) => total + text.length, 0),
  };
}
