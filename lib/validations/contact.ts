import { z } from "zod";
import {
  moroccanPhoneSchema,
  optionalEmailSchema,
} from "@/lib/validations/common";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Le nom complet est obligatoire."),
  phone: moroccanPhoneSchema,
  email: optionalEmailSchema,
  subject: z.string().trim().min(2, "Le sujet est obligatoire."),
  message: z
    .string()
    .trim()
    .min(8, "Le message doit contenir au moins 8 caractères.")
    .max(2000, "Le message est trop long."),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
