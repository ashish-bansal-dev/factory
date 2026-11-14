import i18next from "i18next"
import { z } from "zod"

export const CreateProductVariantSchema = z.object({
  title: z.string().min(1, i18next.t("products.variant.validation.titleRequired")),
  sku: z.string().optional(),
  options: z
    .record(
      z.string(),
      z.string().min(1, i18next.t("products.variant.validation.optionRequired"))
    )
    .optional(),
  variant_type: z.enum(["retail", "wholesale"]).default("retail"),
  bundle_size: z.union([z.coerce.number().int().min(1), z.literal("")]).default(1),
  pack_description: z.string().default("Single pc"),
  mrp: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
})
