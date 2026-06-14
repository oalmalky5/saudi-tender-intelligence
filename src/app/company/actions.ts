"use server";

import {
  companyProfileSchema,
  parseProfileList,
} from "@/lib/company/profile-schema";
import { requireWorkspace } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveCompanyProfile(formData: FormData): Promise<void> {
  const { workspace } = await requireWorkspace();
  const result = companyProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    summary: formData.get("summary"),
    services: parseProfileList(formData.get("services")),
    activities: parseProfileList(formData.get("activities")),
    industries: parseProfileList(formData.get("industries")),
    targetGovernmentEntities: parseProfileList(
      formData.get("targetGovernmentEntities"),
    ),
    regions: parseProfileList(formData.get("regions")),
    preferredKeywords: parseProfileList(formData.get("preferredKeywords")),
    excludedKeywords: parseProfileList(formData.get("excludedKeywords")),
    preferredOpportunityTypes: formData
      .getAll("preferredOpportunityTypes")
      .flatMap((value) => parseProfileList(value)),
  });

  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Profile validation failed.";
    redirect(`/company?error=${encodeURIComponent(message)}`);
  }

  await prisma.companyProfile.upsert({
    where: { workspaceId: workspace.id },
    create: {
      id: `profile-${workspace.id}`,
      workspaceId: workspace.id,
      ...result.data,
    },
    update: result.data,
  });

  revalidatePath("/company");
  redirect("/company?saved=1");
}
