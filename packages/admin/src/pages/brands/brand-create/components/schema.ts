import { z } from "zod"
import { BrandStatus } from "@mercurjs/types"

export const CreateBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  website_url: z.string().optional(),
  status: z.nativeEnum(BrandStatus).default(BrandStatus.APPROVED),
  seller_ids: z.array(z.string()).optional(),
})

export type CreateBrandSchemaType = z.infer<typeof CreateBrandSchema>
