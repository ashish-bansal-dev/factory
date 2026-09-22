import { z } from "zod"

export type StoreCreateInquiryType = z.infer<typeof StoreCreateInquiry>
export const StoreCreateInquiry = z.object({
  store_name: z.string().min(1),
  contact_number: z.string().min(6),
  location: z.string().min(1),
  product_id: z.string().min(1),
  variant_id: z.string().nullish(),
  seller_id: z.string().nullish(),
  source_domain: z.string().nullish(),
  notes: z.string().nullish(),
  quantity: z.number().nullish(),
})
