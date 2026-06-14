"use server";

import { prisma } from "@/lib/prisma";
import { runMonitoring } from "@/lib/monitoring/run-monitoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PRIMARY_PROFILE_ID = "primary";

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
  let runId: string;

  try {
    const run = await runMonitoring(prisma);
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
    where: { id: PRIMARY_PROFILE_ID },
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
  const notificationId = formData.get("notificationId");
  if (typeof notificationId !== "string" || !notificationId) {
    throw new Error("Notification ID is required.");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  await prisma.notification.updateMany({
    where: { companyProfileId: PRIMARY_PROFILE_ID, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}
