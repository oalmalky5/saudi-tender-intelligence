import { parse } from "csv-parse/sync";

import {
  csvTenderSchema,
  mapCsvHeaders,
  MAX_CSV_ROWS,
  normalizeCsvTenderRow,
  type CsvTender,
  type CsvTenderField,
} from "./tender-csv-schema";

export type CsvImportRow = {
  rowNumber: number;
  status: "valid" | "invalid" | "duplicate";
  tender: CsvTender | null;
  errors: string[];
};

export type CsvImportPreview = {
  headerMapping: Partial<Record<CsvTenderField, string>>;
  rows: CsvImportRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
};

export function parseTenderCsv(content: string): CsvImportPreview {
  const records = parse(content, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: false,
  }) as Array<Record<string, string>>;

  if (records.length > MAX_CSV_ROWS) {
    throw new Error(`CSV exceeds the ${MAX_CSV_ROWS.toLocaleString()} row limit.`);
  }

  const headers = records[0] ? Object.keys(records[0]) : [];
  const headerMapping = mapCsvHeaders(headers);
  const missingRequired = [
    "referenceNumber",
    "titleArabic",
    "agencyNameArabic",
    "tenderTypeNameArabic",
    "publishedAt",
  ].filter((field) => !headerMapping[field as CsvTenderField]);

  if (missingRequired.length > 0) {
    throw new Error(`Missing required mapped fields: ${missingRequired.join(", ")}.`);
  }

  const seenReferences = new Set<string>();
  const rows: CsvImportRow[] = records.map((record, index) => {
    const parsed = csvTenderSchema.safeParse(
      normalizeCsvTenderRow(record, headerMapping),
    );

    if (!parsed.success) {
      return {
        rowNumber: index + 2,
        status: "invalid",
        tender: null,
        errors: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "row"}: ${issue.message}`,
        ),
      };
    }

    if (seenReferences.has(parsed.data.referenceNumber)) {
      return {
        rowNumber: index + 2,
        status: "duplicate",
        tender: parsed.data,
        errors: ["Duplicate reference number within this CSV."],
      };
    }

    seenReferences.add(parsed.data.referenceNumber);
    return {
      rowNumber: index + 2,
      status: "valid",
      tender: parsed.data,
      errors: [],
    };
  });

  return {
    headerMapping,
    rows,
    totalRows: rows.length,
    validRows: rows.filter((row) => row.status === "valid").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
  };
}
