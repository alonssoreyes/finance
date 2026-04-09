import { z } from "zod";

export const createAccountSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  type: z.enum(["CHECKING", "DEBIT", "SAVINGS", "CASH", "INVESTMENT", "CREDIT_CARD", "LOAN", "OTHER"]),
  institution: z.string().optional(),
  last4: z.string().max(4).optional(),
  currentBalance: z.coerce.number(),
  availableBalance: z.coerce.number().optional(),
  creditLimit: z.coerce.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional()
});
