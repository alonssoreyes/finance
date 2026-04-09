"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { ensureUserFinancialDefaults } from "@/lib/financial-defaults";
import { prisma } from "@/lib/prisma";
import { comparePassword, createSession } from "@/lib/auth";
import { signInSchema, signUpSchema, type AuthFormState } from "@/validations/auth";

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos."
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  if (!user) {
    return { error: "No existe una cuenta con ese email." };
  }

  const passwordValid = await comparePassword(parsed.data.password, user.passwordHash);

  if (!passwordValid) {
    return { error: "Contraseña incorrecta." };
  }

  await ensureUserFinancialDefaults(prisma, user.id);
  await createSession(user);
  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos inválidos."
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Ese email ya está registrado." };
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      settings: {
        create: {}
      }
    }
  });

  await ensureUserFinancialDefaults(prisma, user.id);
  await createSession(user);
  redirect("/dashboard");
}

export async function signOutAction() {
  const { clearSession } = await import("@/lib/auth");
  await clearSession();
  redirect("/sign-in");
}
