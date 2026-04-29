import { z } from "zod";
import { i18n } from "../i18n";
import { clientAddressLinesFromText } from "./client-orders";

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, i18n.validation.requiredEmail).email(i18n.auth.invalidEmail),
  password: z.string().min(1, i18n.auth.passwordRequired),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const clientSignupSchema = z
  .object({
    accessCode: z
      .string()
      .trim()
      .min(8, "كود الدخول يجب ألا يقل عن 8 أحرف.")
      .max(32, "كود الدخول يجب ألا يزيد عن 32 حرفًا.")
      .regex(/^[A-Za-z0-9]+$/, "كود الدخول يجب أن يتكون من حروف وأرقام فقط."),
    addressesText: z.string().trim().max(1200, "العناوين طويلة جدًا.").optional().or(z.literal("")),
    displayName: z.string().trim().min(2, "اسم العميل يجب ألا يقل عن حرفين.").max(100, "اسم العميل طويل جدًا."),
    email: z.string().trim().min(1, i18n.validation.requiredEmail).email(i18n.auth.invalidEmail),
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

export type ClientSignupValues = z.infer<typeof clientSignupSchema>;

export const sessionRequestSchema = z.object({}).strict();
