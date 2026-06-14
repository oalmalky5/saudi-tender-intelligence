"use server";

import { createWeeklyTenderReport } from "@/lib/reports/create-weekly-report";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/auth/session";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";
import { revalidatePath } from "next/cache";

export type WeeklyReportActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function reportDate(value: FormDataEntryValue | null, endOfDay: boolean): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Select a valid report date range.");
  }
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+03:00`);
}

export async function generateWeeklyReportAction(
  _previousState: WeeklyReportActionState,
  formData: FormData,
): Promise<WeeklyReportActionState> {
  try {
    const { workspace } = await requireWorkspace();
    if (!workspace.companyProfile) {
      throw new Error("Create a company profile before generating a weekly report.");
    }
    const dateFrom = reportDate(formData.get("dateFrom"), false);
    const dateTo = reportDate(formData.get("dateTo"), true);
    if (dateFrom > dateTo) {
      throw new Error("The report start date must be before the end date.");
    }
    if (dateTo.getTime() - dateFrom.getTime() > 31 * 24 * 60 * 60 * 1_000) {
      throw new Error("Report date ranges are limited to 31 days.");
    }

    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.paidAi);
    const report = await createWeeklyTenderReport(
      prisma,
      dateFrom,
      dateTo,
      workspace.companyProfile.id,
      workspace.id,
    );

    revalidatePath("/reports/weekly");
    return {
      status: "success",
      message: `Weekly report generated from ${report.candidateCount} curated candidates.`,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The weekly tender report could not be generated.",
    };
  }
}
