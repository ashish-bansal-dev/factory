import { z } from "zod"

export const RequestBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  handle: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  website_url: z.string().optional(),
})

export type RequestBrandSchemaType = z.infer<typeof RequestBrandSchema>
