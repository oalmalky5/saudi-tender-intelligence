import assert from "node:assert/strict";
import test from "node:test";

import type { EtimadTenderDetailSnapshot } from "./fetch-tender-detail";
import { parseEtimadTenderDetail } from "./parse-tender-detail";

function field(label: string, value: string): string {
  return `<li class="list-group-item"><div class="etd-item-title">${label}</div><div class="etd-item-info">${value}</div></li>`;
}

const snapshot: EtimadTenderDetailSnapshot = {
  basicHtml: `
    <span id="purposeSpan">وصف المنافسة الكامل<i class="readLess">عرض الأقل</i></span>
    ${field("رقم المنافسة", "T-123")}
    ${field("حالة المنافسة", "معتمدة")}
    ${field("مدة العقد", "3 سنة")}
    ${field("قيمة وثائق المنافسة", "1,000.00")}
    ${field("مطلوب ضمان الإبتدائي", "ضمان إبتدائى")}
    ${field("الضمان النهائي", "5.00")}
    ${field("هل التأمين من متطلبات المنافسة", "لا")}
  `,
  datesHtml: `
    ${field("آخر موعد لتقديم العروض", "12/07/2026 27/01/1448 09:59 AM")}
    ${field("التاريخ المتوقع للترسية", "06/08/2026 23/02/1448")}
  `,
  relationsHtml: `
    ${field("مجال التصنيف", "قطاع الاتصالات وتقنية المعلومات")}
    ${field("مكان التنفيذ", "داخل المملكة منطقة الرياض الرياض")}
    ${field("التفاصيل", "المقر الرئيسي")}
  `,
  attachmentsHtml: "",
  localContentHtml: field(
    "آليات المحتوى المحلي المطبقة في المنافسة",
    "تفضيل المنشآت الصغيرة والمتوسطة",
  ),
  awardingHtml: "",
};

test("parses normalized fields from Etimad detail HTML", () => {
  const detail = parseEtimadTenderDetail(snapshot);

  assert.equal(detail.descriptionArabic, "وصف المنافسة الكامل");
  assert.equal(detail.tenderNumber, "T-123");
  assert.equal(detail.documentPrice, 1000);
  assert.equal(detail.initialGuaranteeRequired, true);
  assert.equal(detail.insuranceRequired, false);
  assert.equal(detail.executionRegionArabic, "الرياض");
  assert.equal(detail.executionCityArabic, "الرياض");
  assert.equal(
    detail.submissionDeadline?.toISOString(),
    "2026-07-12T06:59:00.000Z",
  );
});

test("treats unavailable detail values as unknown", () => {
  const detail = parseEtimadTenderDetail({
    ...snapshot,
    datesHtml: field("التاريخ المتوقع للترسية", "لا يوجد"),
    relationsHtml: "",
  });

  assert.equal(detail.expectedAwardAt, null);
  assert.equal(detail.executionRegionArabic, null);
  assert.equal(detail.executionCityArabic, null);
});

test("parses public attachment metadata without downloading files", () => {
  const detail = parseEtimadTenderDetail({
    ...snapshot,
    attachmentsHtml: `
      <button onclick="RedirectURL('file-123', 'الشروط.pdf')">تحميل</button>
    `,
  });

  assert.deepEqual(detail.attachments, [
    {
      sourceAttachmentKey: "file-123",
      nameArabic: "الشروط.pdf",
      sourceUrl:
        "https://tenders.etimad.sa/Upload/getfile/file-123:%D8%A7%D9%84%D8%B4%D8%B1%D9%88%D8%B7.pdf",
    },
  ]);
});
