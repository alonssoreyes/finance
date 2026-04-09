import { z } from "zod";

export type AuthFormState = {
  error?: string;
};

export const signInSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  password: z.string().min(8, "La contraseña es obligatoria.")
});

export const signUpSchema = signInSchema.extend({
  name: z.string().min(2, "Tu nombre es obligatorio.")
});
