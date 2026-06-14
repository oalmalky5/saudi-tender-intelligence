"use server";

import { requireWorkspace } from "@/lib/auth/session";
import { runMonitoring } from "@/lib/monitoring/run-monitoring";
import { prisma } from "@/lib/prisma";
import {
  enforceWorkspaceRateLimit,
  RATE_LIMITS,
} from "@/lib/reliability/rate-limit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function readRequiredString(formData: FormData, name: string): string {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

function revalidateTenderPages(tenderId: string): void {
  revalidatePath("/tenders");
  revalidatePath("/tenders/saved");
  revalidatePath(`/tenders/${tenderId}`);
}

function tenderReturnUrl(formData: FormData): URL {
  const returnTo = formData.get("returnTo");
  const url = new URL(
    typeof returnTo === "string" ? returnTo : "/tenders",
    "http://local",
  );

  if (url.pathname !== "/tenders") {
    return new URL("/tenders", "http://local");
  }

  url.searchParams.delete("refresh");
  url.searchParams.delete("refreshError");
  return url;
}

export async function refreshTenderDiscovery(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const returnUrl = tenderReturnUrl(formData);

  try {
    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.monitoring);
    const run = await runMonitoring(prisma, {
      workspaceId: workspace.id,
      companyProfileId: workspace.companyProfile?.id ?? "",
    });

    revalidatePath("/tenders");
    revalidatePath("/tenders/recommended");
    revalidatePath("/notifications");
    returnUrl.searchParams.set(
      "refresh",
      `${run.recordsFetched},${run.newTenderCount},${run.changedTenderCount}`,
    );
  } catch (error) {
    returnUrl.searchParams.set(
      "refreshError",
      error instanceof Error ? error.message : "Etimad refresh failed.",
    );
  }

  redirect(`${returnUrl.pathname}${returnUrl.search}`);
}

export async function updateTenderDecision(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const tenderId = readRequiredString(formData, "tenderId");
  const status = readRequiredString(formData, "status");

  if (status !== "SAVED" && status !== "IGNORED" && status !== "CLEAR") {
    throw new Error("Invalid tender decision status.");
  }

  await prisma.tenderDecision.upsert({
    where: { workspaceId_tenderId: { workspaceId: workspace.id, tenderId } },
    create: {
      workspaceId: workspace.id,
      tenderId,
      status: status === "CLEAR" ? null : status,
    },
    update: {
      status: status === "CLEAR" ? null : status,
    },
  });

  revalidateTenderPages(tenderId);
}

export async function updateTenderNote(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const tenderId = readRequiredString(formData, "tenderId");
  const noteValue = formData.get("note");
  const note =
    typeof noteValue === "string" && noteValue.trim()
      ? noteValue.trim()
      : null;

  await prisma.tenderDecision.upsert({
    where: { workspaceId_tenderId: { workspaceId: workspace.id, tenderId } },
    create: { workspaceId: workspace.id, tenderId, note },
    update: { note },
  });

  revalidateTenderPages(tenderId);
  redirect(`/tenders/${tenderId}?noteSaved=1`);
}
