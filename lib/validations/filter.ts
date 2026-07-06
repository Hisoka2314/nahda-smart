import { z } from "zod";
import { slugSchema } from "@/lib/validations/common";

export const filterInputTypeSchema = z.enum([
  "CHECKBOX",
  "RADIO",
  "RANGE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
  "SEARCH_LIST",
  "NUMERIC_RANGE",
]);

export const filterOptionSchema = z.object({
  label: z.string().trim().min(1, "Libellé option obligatoire."),
  value: z.string().trim().min(1, "Valeur option obligatoire."),
  order: z.coerce.number().int().min(0).default(0),
  visible: z.boolean().default(true),
});

export const filterAttributeSchema = z.object({
  groupId: z.string().min(1),
  categoryId: z.string().min(1),
  label: z.string().trim().min(1, "Libellé filtre obligatoire."),
  slug: slugSchema,
  type: filterInputTypeSchema,
  unit: z.string().trim().optional(),
  filterable: z.boolean().default(true),
  searchable: z.boolean().default(false),
  visible: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
  options: z.array(filterOptionSchema).default([]),
});

export const filterGroupSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1, "Nom groupe obligatoire."),
  slug: slugSchema,
  order: z.coerce.number().int().min(0).default(0),
  defaultOpen: z.boolean().default(false),
  isAdvanced: z.boolean().default(false),
  visible: z.boolean().default(true),
});

export type FilterAttributeInput = z.infer<typeof filterAttributeSchema>;
export type FilterGroupInput = z.infer<typeof filterGroupSchema>;
