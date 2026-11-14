import { z } from "zod"

export const CreateProductVariantSchema = z.object({
  title: z.string().min(1),
  sku: z.string().optional(),
  options: z.record(z.string(), z.string()).optional(),
  variant_type: z.enum(["retail", "wholesale"]).default("retail"),
  bundle_size: z.union([z.coerce.number().int().min(1), z.literal("")]).default(1),
  pack_description: z.string().default("Single pc"),
  mrp: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
})

export const CreateVariantDetailsSchema = CreateProductVariantSchema.pick({
  title: true,
  sku: true,
  options: true,
  variant_type: true,
  bundle_size: true,
  pack_description: true,
  mrp: true,
})

export const CreateVariantDetailsFields = Object.keys(
  CreateVariantDetailsSchema.shape
) as (keyof typeof CreateVariantDetailsSchema.shape)[]
