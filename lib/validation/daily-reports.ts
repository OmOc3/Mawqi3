import { z } from "zod";

export const createDailyWorkReportSchema = z.object({
  notes: z.string().trim().max(800).optional(),
  reportDate: z.string().trim().min(1),
  stationIds: z.array(z.string().trim().min(1)).max(50),
  summary: z.string().trim().min(10).max(1200),
});

export type CreateDailyWorkReportValues = z.infer<typeof createDailyWorkReportSchema>;
