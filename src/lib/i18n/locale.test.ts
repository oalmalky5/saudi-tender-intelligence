import assert from "node:assert/strict";
import test from "node:test";

import { dateLocale, localeDirection, parseLocale, pick } from "./locale";

test("normalizes supported and unsupported locale values", () => {
  assert.equal(parseLocale("ar"), "ar");
  assert.equal(parseLocale("en"), "en");
  assert.equal(parseLocale("fr"), "en");
  assert.equal(parseLocale(undefined), "en");
});

test("provides locale-specific presentation helpers", () => {
  assert.equal(localeDirection("ar"), "rtl");
  assert.equal(localeDirection("en"), "ltr");
  assert.equal(dateLocale("ar"), "ar-SA");
  assert.equal(pick("ar", "Saved", "محفوظة"), "محفوظة");
});
