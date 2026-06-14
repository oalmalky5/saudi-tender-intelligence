import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
  type SessionPayload,
} from "./session-core";

export async function getSession(): Promise<SessionPayload | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function createSession(
  payload: Omit<SessionPayload, "expiresAt">,
): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireWorkspace() {
  const session = await requireSession();
  const workspace = await prisma.workspace.findFirst({
    where: { id: session.workspaceId, userId: session.userId },
    include: { companyProfile: true },
  });
  if (!workspace) {
    redirect("/sign-in");
  }
  return { session, workspace };
}
