"use server";

import { requireWorkspace } from "@/lib/auth/session";
import { csvTenderSchema, MAX_CSV_BYTES } from "@/lib/csv/tender-csv-schema";
import { parseTenderCsv } from "@/lib/csv/parse-tender-csv";
import { persistCsvTenders } from "@/lib/csv/persist-csv-tenders";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";

export async function previewCsvImport(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const file = formData.get("csv");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/import?error=Select+a+CSV+file.");
  }
  if (file.size > MAX_CSV_BYTES) {
    redirect("/admin/import?error=CSV+exceeds+the+5+MB+limit.");
  }

  let sessionId: string;

  try {
    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.csvImport);
    const preview = parseTenderCsv(await file.text());
    const session = await prisma.csvImportSession.create({
      data: {
        workspaceId: workspace.id,
        originalName: file.name.slice(0, 255),
        status: "preview",
        headerMapping: JSON.parse(JSON.stringify(preview.headerMapping)),
        rows: JSON.parse(JSON.stringify(preview.rows)),
        totalRows: preview.totalRows,
        validRows: preview.validRows,
        invalidRows: preview.invalidRows,
        duplicateRows: preview.duplicateRows,
      },
    });
    sessionId = session.id;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CSV preview failed.";
    redirect(`/admin/import?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/import?session=${sessionId}`);
}

export async function confirmCsvImport(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const sessionId = formData.get("sessionId");

  if (typeof sessionId !== "string" || !sessionId) {
    redirect("/admin/import?error=Import+session+is+required.");
  }

  const session = await prisma.csvImportSession.findFirst({
    where: { id: sessionId, workspaceId: workspace.id },
  });

  if (!session || session.status !== "preview") {
    redirect("/admin/import?error=Import+session+is+not+available.");
  }

  const storedRows = Array.isArray(session.rows) ? session.rows : [];
  const validTenders = storedRows.flatMap((row) => {
    if (
      typeof row !== "object" ||
      row === null ||
      !("status" in row) ||
      row.status !== "valid" ||
      !("tender" in row)
    ) {
      return [];
    }
    const parsed = csvTenderSchema.safeParse(row.tender);
    return parsed.success ? [parsed.data] : [];
  });

  if (validTenders.length !== session.validRows) {
    redirect(
      `/admin/import?session=${session.id}&error=${encodeURIComponent(
        "Stored preview no longer passes validation.",
      )}`,
    );
  }

  const result = await persistCsvTenders(prisma, validTenders);
  await prisma.csvImportSession.update({
    where: { id: session.id },
    data: {
      status: "complete",
      createdCount: result.created,
      updatedCount: result.updated,
      completedAt: new Date(),
    },
  });

  revalidatePath("/tenders");
  revalidatePath("/admin/import");
  redirect(`/admin/import?session=${session.id}&imported=1`);
}
