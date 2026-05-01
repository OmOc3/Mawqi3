import { z } from "zod";
import { pestTypeOptions, reportStatusOptions, reviewStatuses } from "../shared/constants";

const statusOptionSchema = z.enum(reportStatusOptions);
const pestTypeOptionSchema = z.enum(pestTypeOptions);

export const submitReportSchema = z.object({
  stationId: z.string().trim().min(1),
  status: z.array(statusOptionSchema).min(1),
  pestTypes: z.array(pestTypeOptionSchema).min(1, "اختر نوعاً واحداً على الأقل من برنامج التنفيذ"),
  notes: z.string().trim().max(500).optional(),
  beforePhoto: z.instanceof(File).optional(),
  afterPhoto: z.instanceof(File).optional(),
  duringPhotos: z.array(z.instanceof(File)).max(6).optional(),
  otherPhotos: z.array(z.instanceof(File)).max(6).optional(),
  stationPhoto: z.instanceof(File).optional(),
});

export const reviewReportSchema = z
  .object({
    reviewStatus: z.enum(reviewStatuses),
    reviewNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reviewStatus === "rejected") {
      const notes = data.reviewNotes?.trim() ?? "";
      if (notes.length < 3) {
        ctx.addIssue({
          code: "custom",
          message: "أدخل سبب الرفض (3 أحرف على الأقل).",
          path: ["reviewNotes"],
        });
      }
    }
  });

export const editSubmittedReportSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  status: z.array(statusOptionSchema).min(1),
  pestTypes: z.array(pestTypeOptionSchema).min(1),
});

export type SubmitReportValues = z.infer<typeof submitReportSchema>;
export type ReviewReportValues = z.infer<typeof reviewReportSchema>;
export type EditSubmittedReportValues = z.infer<typeof editSubmittedReportSchema>;
