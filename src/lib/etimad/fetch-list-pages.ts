import { fetchEtimadListPage } from "./fetch-list-page";
import type { EtimadListPage, EtimadListTender } from "./list-schema";

const DEFAULT_PAGE_LIMIT = 5;
const REQUEST_DELAY_MS = 500;

export type EtimadListPages = {
  tenders: EtimadListTender[];
  pagesFetched: number;
  totalCount: number;
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchEtimadListPages(
  pageLimit = DEFAULT_PAGE_LIMIT,
): Promise<EtimadListPages> {
  if (!Number.isInteger(pageLimit) || pageLimit < 1) {
    throw new Error("Etimad page limit must be a positive integer.");
  }

  const pages: EtimadListPage[] = [];

  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    if (pageNumber > 1) {
      await wait(REQUEST_DELAY_MS);
    }

    const page = await fetchEtimadListPage(pageNumber);
    pages.push(page);

    const totalPages = Math.ceil(page.totalCount / page.pageSize);
    if (pageNumber >= totalPages) {
      break;
    }
  }

  const tendersByReference = new Map<string, EtimadListTender>();

  for (const tender of pages.flatMap((page) => page.data)) {
    tendersByReference.set(tender.referenceNumber, tender);
  }

  return {
    tenders: [...tendersByReference.values()],
    pagesFetched: pages.length,
    totalCount: pages[0]?.totalCount ?? 0,
  };
}
