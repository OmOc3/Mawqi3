import { z } from "zod";

export const updateUserRoleSchema = z.object({
  role: z.enum(["technician", "supervisor", "manager"]),
});

export const updateUserActiveSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserRoleValues = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserActiveValues = z.infer<typeof updateUserActiveSchema>;
