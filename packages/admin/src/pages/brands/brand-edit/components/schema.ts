import { z } from "zod"
import { BrandStatus } from "@mercurjs/types"

export const EditBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  website_url: z.string().optional(),
  status: z.nativeEnum(BrandStatus).optional(),
  seller_ids: z.array(z.string()).optional(),
})

export type EditBrandSchemaType = z.infer<typeof EditBrandSchema>
