import { cookies } from "next/headers";

import { LOCALE_COOKIE, parseLocale, type Locale } from "./locale";

export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}
