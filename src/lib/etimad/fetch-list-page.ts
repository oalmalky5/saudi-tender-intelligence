import { etimadListPageSchema, type EtimadListPage } from "./list-schema";

const ETIMAD_LIST_URL =
  "https://tenders.etimad.sa/Tender/AllSupplierTendersForVisitorAsync";

export async function fetchEtimadListPage(pageNumber = 1): Promise<EtimadListPage> {
  const url = new URL(ETIMAD_LIST_URL);
  url.searchParams.set("PageSize", "24");
  url.searchParams.set("PublishDateId", "5");
  url.searchParams.set("TenderCategory", "2");
  url.searchParams.set("PageNumber", String(pageNumber));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ar-SA,ar;q=0.9,en;q=0.8",
      Referer: "https://tenders.etimad.sa/Tender/AllTendersForVisitor",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/137 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Etimad request failed with ${response.status} ${response.statusText}.`,
    );
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error(
      `Etimad returned ${contentType ?? "an unknown content type"} instead of JSON. Its traffic protection may be blocking the request.`,
    );
  }

  const payload: unknown = await response.json();
  return etimadListPageSchema.parse(payload);
}
