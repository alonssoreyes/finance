import { z } from "zod";

export const createGoalSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  targetDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  monthlySuggestedContribution: z.coerce.number().min(0),
  linkedAccountId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  notes: z.string().optional()
});
