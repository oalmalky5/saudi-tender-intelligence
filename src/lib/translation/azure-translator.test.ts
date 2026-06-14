import assert from "node:assert/strict";
import test from "node:test";

import { translateArabicTextsWithAzure } from "./azure-translator";

test("translates Arabic texts through the Azure response contract", async () => {
  const previousKey = process.env.AZURE_TRANSLATOR_KEY;
  const previousEndpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
  process.env.AZURE_TRANSLATOR_KEY = "test-key";
  process.env.AZURE_TRANSLATOR_ENDPOINT =
    "https://api.cognitive.microsofttranslator.com";

  const translated = await translateArabicTextsWithAzure(
    ["عنوان", "وصف"],
    async () =>
      new Response(
        JSON.stringify([
          { translations: [{ text: "Title", to: "en" }] },
          { translations: [{ text: "Description", to: "en" }] },
        ]),
        { status: 200 },
      ),
  );

  assert.deepEqual(translated, ["Title", "Description"]);
  if (previousKey === undefined) delete process.env.AZURE_TRANSLATOR_KEY;
  else process.env.AZURE_TRANSLATOR_KEY = previousKey;
  if (previousEndpoint === undefined) delete process.env.AZURE_TRANSLATOR_ENDPOINT;
  else process.env.AZURE_TRANSLATOR_ENDPOINT = previousEndpoint;
});
