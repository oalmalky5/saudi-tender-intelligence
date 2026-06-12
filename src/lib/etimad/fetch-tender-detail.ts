const ETIMAD_BASE_URL = "https://tenders.etimad.sa";
const REQUEST_DELAY_MS = 300;

const componentPaths = {
  datesHtml: "/Tender/GetTenderDatesViewComponenet",
  relationsHtml: "/Tender/GetRelationsDetailsViewComponenet",
  attachmentsHtml: "/Tender/GetAttachmentsViewComponenet",
  localContentHtml: "/Tender/GetLocalContentDetailsViewComponenet",
  awardingHtml: "/Tender/GetAwardingResultsForVisitorViewComponenet",
} as const;

export type EtimadTenderDetailSnapshot = {
  basicHtml: string;
  datesHtml: string;
  relationsHtml: string;
  attachmentsHtml: string;
  localContentHtml: string;
  awardingHtml: string;
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchHtml(url: URL): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html, */*; q=0.01",
      "Accept-Language": "ar-SA,ar;q=0.9,en;q=0.8",
      Referer: `${ETIMAD_BASE_URL}/Tender/AllTendersForVisitor`,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/137 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Etimad detail request failed with ${response.status} ${response.statusText}.`,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("text/html")) {
    throw new Error(
      `Etimad detail request returned ${contentType ?? "an unknown content type"} instead of HTML.`,
    );
  }

  return response.text();
}

export async function fetchEtimadTenderDetail(
  sourceTenderIdString: string,
): Promise<EtimadTenderDetailSnapshot> {
  const basicUrl = new URL("/Tender/DetailsForVisitor", ETIMAD_BASE_URL);
  basicUrl.searchParams.set("STenderId", sourceTenderIdString);

  const snapshot: Partial<EtimadTenderDetailSnapshot> = {
    basicHtml: await fetchHtml(basicUrl),
  };

  for (const [name, path] of Object.entries(componentPaths)) {
    await wait(REQUEST_DELAY_MS);
    const url = new URL(path, ETIMAD_BASE_URL);
    url.searchParams.set("tenderIdStr", sourceTenderIdString);
    snapshot[name as keyof EtimadTenderDetailSnapshot] = await fetchHtml(url);
  }

  return snapshot as EtimadTenderDetailSnapshot;
}
