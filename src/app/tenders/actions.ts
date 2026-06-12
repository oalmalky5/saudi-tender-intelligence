"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function updateTenderDecision(formData: FormData): Promise<void> {
  const tenderId = readRequiredString(formData, "tenderId");
  const status = readRequiredString(formData, "status");

  if (status !== "SAVED" && status !== "IGNORED" && status !== "CLEAR") {
    throw new Error("Invalid tender decision status.");
  }

  await prisma.tenderDecision.upsert({
    where: { tenderId },
    create: {
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
  const tenderId = readRequiredString(formData, "tenderId");
  const noteValue = formData.get("note");
  const note =
    typeof noteValue === "string" && noteValue.trim()
      ? noteValue.trim()
      : null;

  await prisma.tenderDecision.upsert({
    where: { tenderId },
    create: { tenderId, note },
    update: { note },
  });

  revalidateTenderPages(tenderId);
}
