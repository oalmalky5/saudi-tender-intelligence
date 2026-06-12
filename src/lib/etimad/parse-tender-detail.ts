import * as cheerio from "cheerio";

import type { EtimadTenderDetailSnapshot } from "./fetch-tender-detail";

const SAUDI_UTC_OFFSET = "+03:00";

export type ParsedEtimadTenderDetail = {
  descriptionArabic: string | null;
  tenderNumber: string | null;
  tenderStatusNameArabic: string | null;
  contractDurationArabic: string | null;
  submissionMethodArabic: string | null;
  documentPrice: number | null;
  initialGuaranteeRequired: boolean | null;
  finalGuaranteePercentage: number | null;
  insuranceRequired: boolean | null;
  enquiriesDeadline: Date | null;
  submissionDeadline: Date | null;
  offersOpeningAt: Date | null;
  expectedAwardAt: Date | null;
  workStartsAt: Date | null;
  classificationFieldArabic: string | null;
  executionRegionArabic: string | null;
  executionCityArabic: string | null;
  executionDetailsArabic: string | null;
  localContentRequirementsArabic: string | null;
  attachments: ParsedEtimadAttachment[];
};

export type ParsedEtimadAttachment = {
  sourceAttachmentKey: string;
  nameArabic: string;
  sourceUrl: string;
};

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
}

function extractFields(html: string): Map<string, string> {
  const $ = cheerio.load(html);
  const fields = new Map<string, string>();

  $(".list-group-item").each((_, element) => {
    const label = cleanText(
      $(element).find(".etd-item-title").first().text(),
    );
    const value = cleanText($(element).find(".etd-item-info").first().text());

    if (label) {
      fields.set(label, value);
    }
  });

  return fields;
}

function optionalText(value: string | undefined): string | null {
  if (!value || value === "لا يوجد") {
    return null;
  }

  return value;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseArabicBoolean(value: string | undefined): boolean | null {
  if (!value) {
    return null;
  }

  if (value === "لا") {
    return false;
  }

  if (value === "نعم" || value.includes("ضمان")) {
    return true;
  }

  return null;
}

function parseEtimadDetailDate(value: string | undefined): Date | null {
  if (!value || value === "لا يوجد") {
    return null;
  }

  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}\/\d{2}\/\d{4})?(?:\s+(\d{2}):(\d{2})\s+(AM|PM))?/,
  );

  if (!match) {
    return null;
  }

  const [, day, month, year, hourText, minute = "00", meridiem] = match;
  let hour = Number(hourText ?? "00");

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  } else if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  const date = new Date(
    `${year}-${month}-${day}T${String(hour).padStart(2, "0")}:${minute}:00${SAUDI_UTC_OFFSET}`,
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseExecutionLocation(
  value: string | undefined,
): Pick<
  ParsedEtimadTenderDetail,
  "executionRegionArabic" | "executionCityArabic"
> {
  if (!value) {
    return { executionRegionArabic: null, executionCityArabic: null };
  }

  const location = value.replace(/^داخل المملكة\s*/, "").trim();
  const match = location.match(/^منطقة\s+(.+?)\s+([^ ]+)$/);

  return {
    executionRegionArabic: match?.[1] ?? location,
    executionCityArabic: match?.[2] ?? null,
  };
}

function parseAttachments(html: string): ParsedEtimadAttachment[] {
  const $ = cheerio.load(html);
  const attachments = new Map<string, ParsedEtimadAttachment>();

  $("[onclick*='RedirectURL']").each((_, element) => {
    const onclick = $(element).attr("onclick") ?? "";
    const match = onclick.match(
      /RedirectURL\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/,
    );

    if (!match) {
      return;
    }

    const [, key, name] = match;
    attachments.set(key, {
      sourceAttachmentKey: key,
      nameArabic: cleanText(name),
      sourceUrl: `https://tenders.etimad.sa/Upload/getfile/${encodeURIComponent(key)}:${encodeURIComponent(name)}`,
    });
  });

  return [...attachments.values()];
}

export function parseEtimadTenderDetail(
  snapshot: EtimadTenderDetailSnapshot,
): ParsedEtimadTenderDetail {
  const basic = extractFields(snapshot.basicHtml);
  const dates = extractFields(snapshot.datesHtml);
  const relations = extractFields(snapshot.relationsHtml);
  const localContent = extractFields(snapshot.localContentHtml);
  const basicPage = cheerio.load(snapshot.basicHtml);
  const fullPurpose = cleanText(
    basicPage("#purposeSpan")
      .clone()
      .find(".readLess")
      .remove()
      .end()
      .text(),
  );
  const location = parseExecutionLocation(relations.get("مكان التنفيذ"));

  return {
    descriptionArabic:
      optionalText(fullPurpose) ??
      optionalText(basic.get("الغرض من المنافسة")),
    tenderNumber: optionalText(basic.get("رقم المنافسة")),
    tenderStatusNameArabic: optionalText(basic.get("حالة المنافسة")),
    contractDurationArabic: optionalText(basic.get("مدة العقد")),
    submissionMethodArabic: optionalText(basic.get("طريقة تقديم العروض")),
    documentPrice: parseNumber(basic.get("قيمة وثائق المنافسة")),
    initialGuaranteeRequired: parseArabicBoolean(
      basic.get("مطلوب ضمان الإبتدائي"),
    ),
    finalGuaranteePercentage: parseNumber(basic.get("الضمان النهائي")),
    insuranceRequired: parseArabicBoolean(
      basic.get("هل التأمين من متطلبات المنافسة"),
    ),
    enquiriesDeadline: parseEtimadDetailDate(
      dates.get("آخر موعد لإستلام الإستفسارات"),
    ),
    submissionDeadline: parseEtimadDetailDate(
      dates.get("آخر موعد لتقديم العروض"),
    ),
    offersOpeningAt: parseEtimadDetailDate(dates.get("تاريخ فتح العروض")),
    expectedAwardAt: parseEtimadDetailDate(
      dates.get("التاريخ المتوقع للترسية"),
    ),
    workStartsAt: parseEtimadDetailDate(
      dates.get("تاريخ بدء الأعمال / الخدمات"),
    ),
    classificationFieldArabic: optionalText(relations.get("مجال التصنيف")),
    executionRegionArabic: location.executionRegionArabic,
    executionCityArabic: location.executionCityArabic,
    executionDetailsArabic: optionalText(relations.get("التفاصيل")),
    localContentRequirementsArabic: optionalText(
      localContent.get("آليات المحتوى المحلي المطبقة في المنافسة"),
    ),
    attachments: parseAttachments(snapshot.attachmentsHtml),
  };
}
