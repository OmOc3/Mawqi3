import { z } from "zod";

export function clientAddressLinesFromText(value: string | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export const createClientOrderSchema = z.object({
  stationLabel: z.string().trim().min(2).max(120),
  stationLocation: z.string().trim().min(3).max(300),
  stationDescription: z.string().trim().max(500).optional(),
  note: z.string().trim().max(600).optional(),
});

export const updateClientOrderStatusSchema = z.object({
  orderId: z.string().trim().min(1),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
});

export const updateClientProfileSchema = z
  .object({
    addressesText: z.string().trim().max(1200).optional().or(z.literal("")),
    clientUid: z.string().trim().min(1),
    phone: z
      .string()
      .trim()
      .max(40, "رقم الهاتف طويل جدًا.")
      .regex(/^[0-9+\s().-]*$/, "رقم الهاتف يجب أن يحتوي على أرقام ورموز اتصال فقط.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((values, context) => {
    const addresses = clientAddressLinesFromText(values.addressesText);

    if (addresses.length > 8) {
      context.addIssue({
        code: "custom",
        message: "لا يمكن إضافة أكثر من 8 عناوين للعميل.",
        path: ["addressesText"],
      });
    }

    addresses.forEach((address, index) => {
      if (address.length < 3 || address.length > 180) {
        context.addIssue({
          code: "custom",
          message: `العنوان رقم ${index + 1} يجب أن يكون بين 3 و180 حرفًا.`,
          path: ["addressesText"],
        });
      }
    });
  });

export const updateClientStationAccessSchema = z.object({
  clientUid: z.string().trim().min(1),
  stationIds: z.array(z.string().trim().min(1)).max(500),
});

export type CreateClientOrderValues = z.infer<typeof createClientOrderSchema>;
export type UpdateClientOrderStatusValues = z.infer<typeof updateClientOrderStatusSchema>;
export type UpdateClientProfileValues = z.infer<typeof updateClientProfileSchema>;
export type UpdateClientStationAccessValues = z.infer<typeof updateClientStationAccessSchema>;
