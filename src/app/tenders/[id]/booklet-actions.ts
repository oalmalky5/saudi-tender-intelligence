"use server";

import path from "node:path";

import {
  extractPdfPages,
  isPdf,
  MAX_BOOKLET_BYTES,
} from "@/lib/booklets/extract-pdf";
import { hashBooklet, storeBooklet } from "@/lib/booklets/storage";
import { parseLocale, pick } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type BookletUploadActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function uploadTenderBookletAction(
  _previousState: BookletUploadActionState,
  formData: FormData,
): Promise<BookletUploadActionState> {
  const locale = parseLocale(
    typeof formData.get("locale") === "string"
      ? String(formData.get("locale"))
      : undefined,
  );

  try {
    const tenderId = formData.get("tenderId");
    const file = formData.get("booklet");

    if (typeof tenderId !== "string" || !tenderId.trim()) {
      throw new Error("Tender ID is required.");
    }
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Select a PDF booklet to upload.");
    }
    if (file.size > MAX_BOOKLET_BYTES) {
      throw new Error("The booklet exceeds the 25 MB local upload limit.");
    }

    const tender = await prisma.tender.findUnique({
      where: { id: tenderId },
      select: { id: true },
    });
    if (!tender) {
      throw new Error("Tender not found.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!isPdf(bytes)) {
      throw new Error("The uploaded file is not a valid PDF.");
    }

    const sha256 = hashBooklet(bytes);
    const duplicate = await prisma.tenderBooklet.findUnique({
      where: { tenderId_sha256: { tenderId: tender.id, sha256 } },
      select: { id: true },
    });

    if (duplicate) {
      return {
        status: "success",
        message: pick(
          locale,
          "This unchanged booklet is already stored. No extraction was repeated.",
          "هذه الكراسة غير المتغيرة مخزنة بالفعل، ولم تتم إعادة الاستخراج.",
        ),
      };
    }

    const storedPath = await storeBooklet(tender.id, sha256, bytes);
    const extraction = await extractPdfPages(bytes);
    const originalName = path.basename(file.name).slice(0, 255);

    await prisma.tenderBooklet.create({
      data: {
        tenderId: tender.id,
        originalName,
        storedPath,
        mimeType: file.type || "application/pdf",
        sizeBytes: file.size,
        sha256,
        pageCount: extraction.pageCount,
        extractedCharacters: extraction.extractedCharacters,
        extractionStatus: extraction.requiresOcr ? "needs_ocr" : "complete",
        extractionMethod: "pdfjs-text-v1",
        requiresOcr: extraction.requiresOcr,
        extractedAt: new Date(),
        pages: {
          create: extraction.pages,
        },
      },
    });

    revalidatePath(`/tenders/${tender.id}`);

    return {
      status: "success",
      message: extraction.requiresOcr
        ? pick(
            locale,
            "The booklet was stored, but extracted text is sparse and likely requires OCR before AI analysis.",
            "تم تخزين الكراسة، لكن النص المستخرج قليل ويحتاج غالباً إلى التعرف الضوئي قبل التحليل.",
          )
        : pick(
            locale,
            "The booklet was stored and its page text was extracted locally.",
            "تم تخزين الكراسة واستخراج نص صفحاتها محلياً.",
          ),
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The booklet could not be uploaded.",
    };
  }
}
