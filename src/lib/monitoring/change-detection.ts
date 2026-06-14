import { createHash } from "node:crypto";

import type { TenderListPreview } from "@/lib/etimad/map-list-tender";

export type ExistingTenderVersion = {
  referenceNumber: string;
  sourcePayload: unknown;
};

export type TenderChangeSet = {
  newTenders: TenderListPreview[];
  changedTenders: TenderListPreview[];
  unchangedTenders: TenderListPreview[];
};

const volatileSourceFields = new Set(["currentDateTime", "remainingMins"]);

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !volatileSourceFields.has(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)]),
    );
  }
  return value;
}

export function tenderVersionKey(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

export function classifyTenderChanges(
  existing: ExistingTenderVersion[],
  incoming: TenderListPreview[],
): TenderChangeSet {
  const existingByReference = new Map(
    existing.map((tender) => [
      tender.referenceNumber,
      tenderVersionKey(tender.sourcePayload),
    ]),
  );
  const result: TenderChangeSet = {
    newTenders: [],
    changedTenders: [],
    unchangedTenders: [],
  };

  for (const tender of incoming) {
    const existingVersion = existingByReference.get(tender.referenceNumber);
    if (!existingVersion) {
      result.newTenders.push(tender);
    } else if (existingVersion !== tenderVersionKey(tender.sourcePayload)) {
      result.changedTenders.push(tender);
    } else {
      result.unchangedTenders.push(tender);
    }
  }

  return result;
}
