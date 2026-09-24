import { z } from "zod"
import { optionalFloat } from "../../../../../lib/validation"

export const EditOfferSchema = z.object({
  sku: z.string().min(1).max(64),
  shipping_profile_id: z.string().min(1),
  mrp: optionalFloat,
  bundle_size: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type EditOfferFormValues = z.infer<typeof EditOfferSchema>
