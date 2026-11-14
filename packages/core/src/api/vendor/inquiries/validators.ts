import { z } from "zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const VendorGetInquiriesParams = createFindParams({
  offset: 0,
  limit: 50,
})

export const VendorCreateDraftOrderItem = z
  .object({
    variant_id: z.string(),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(),
    title: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export const VendorCreateDraftOrderFromInquiry = z
  .object({
    items: z.array(VendorCreateDraftOrderItem).min(1),
    currency_code: z.string().optional(),
    shipping_amount: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    customer_id: z.string().optional(),
    email: z.string().email().optional(),
    region_id: z.string().optional(),
    billing_address: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    shipping_address: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type VendorCreateDraftOrderItemType = z.infer<
  typeof VendorCreateDraftOrderItem
>
export type VendorCreateDraftOrderFromInquiryType = z.infer<
  typeof VendorCreateDraftOrderFromInquiry
>
