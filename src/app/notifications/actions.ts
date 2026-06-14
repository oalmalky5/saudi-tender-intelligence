"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/auth/session";
import { runMonitoring } from "@/lib/monitoring/run-monitoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { enforceWorkspaceRateLimit, RATE_LIMITS } from "@/lib/reliability/rate-limit";

function integerSetting(
  formData: FormData,
  name: string,
  minimum: number,
  maximum: number,
): number {
  const value = Number(formData.get(name));
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

export async function runMonitoringNow(): Promise<void> {
  const { workspace } = await requireWorkspace();
  if (!workspace.companyProfile) {
    redirect("/company?error=Create+a+company+profile+before+monitoring.");
  }
  let runId: string;

  try {
    await enforceWorkspaceRateLimit(workspace.id, RATE_LIMITS.monitoring);
    const run = await runMonitoring(prisma, {
      workspaceId: workspace.id,
      companyProfileId: workspace.companyProfile.id,
    });
    runId = run.id;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Monitoring run failed.";
    redirect(`/notifications?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/notifications");
  revalidatePath("/tenders");
  revalidatePath("/tenders/recommended");
  redirect(`/notifications?run=${runId}`);
}

export async function saveNotificationSettings(
  formData: FormData,
): Promise<void> {
  const { workspace } = await requireWorkspace();
  const threshold = integerSetting(
    formData,
    "notificationRelevanceThreshold",
    1,
    100,
  );
  const reminderDays = integerSetting(formData, "deadlineReminderDays", 1, 30);
  const digestFrequency = formData.get("digestFrequency");

  if (
    digestFrequency !== "DAILY" &&
    digestFrequency !== "WEEKLY" &&
    digestFrequency !== "NONE"
  ) {
    throw new Error("Invalid digest frequency.");
  }

  await prisma.companyProfile.update({
    where: { workspaceId: workspace.id },
    data: {
      notificationRelevanceThreshold: threshold,
      deadlineReminderDays: reminderDays,
      digestFrequency,
    },
  });

  revalidatePath("/notifications");
  redirect("/notifications?saved=1");
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string" || !notificationId) {
    throw new Error("Notification ID is required.");
  }

  await prisma.notification.updateMany({
    where: { id: notificationId, companyProfile: { workspaceId: workspace.id } },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const { workspace } = await requireWorkspace();
  await prisma.notification.updateMany({
    where: { companyProfile: { workspaceId: workspace.id }, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}
