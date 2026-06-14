"use server";

import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type SignInState = {
  error: string | null;
};

export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLocaleLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "");
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/tenders";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workspace: true },
  });

  if (
    !user?.workspace ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    return { error: "The email or password is incorrect." };
  }

  await createSession({
    userId: user.id,
    workspaceId: user.workspace.id,
    email: user.email,
    name: user.name,
  });
  redirect(next);
}

export async function signOutAction(): Promise<void> {
  const { deleteSession } = await import("@/lib/auth/session");
  await deleteSession();
  redirect("/sign-in");
}
