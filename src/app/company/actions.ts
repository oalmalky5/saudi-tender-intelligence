"use server";

import {
  companyProfileSchema,
  parseProfileList,
} from "@/lib/company/profile-schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PRIMARY_PROFILE_ID = "primary";

export async function saveCompanyProfile(formData: FormData): Promise<void> {
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
    where: { id: PRIMARY_PROFILE_ID },
    create: { id: PRIMARY_PROFILE_ID, ...result.data },
    update: result.data,
  });

  revalidatePath("/company");
  redirect("/company?saved=1");
}
