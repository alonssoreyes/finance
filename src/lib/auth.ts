import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUserFinancialDefaults } from "@/lib/financial-defaults";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

const SESSION_COOKIE = "gastos_session";
const sessionSecret = new TextEncoder().encode(env.AUTH_SECRET);

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

export async function comparePassword(
  plainTextPassword: string,
  passwordHash: string
) {
  return compare(plainTextPassword, passwordHash);
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string;
}) {
  const token = await new SignJWT({
    email: user.email,
    name: user.name
  } satisfies Omit<SessionPayload, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionPayload(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, sessionSecret);
    return {
      sub: verified.payload.sub!,
      email: String(verified.payload.email),
      name: String(verified.payload.name)
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const payload = await getSessionPayload();
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  if (!user) {
    return null;
  }

  await ensureUserFinancialDefaults(prisma, user.id);
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
