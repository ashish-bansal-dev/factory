import { z } from "zod"
import { createFindParams, createSelectParams } from "@medusajs/medusa/api/utils/validators"

export const StoreGetBrandsParamsFields = z.object({
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.string().optional(),
  handle: z.string().optional(),
  q: z.string().optional(),
})

export type StoreGetBrandsParamsType = z.infer<typeof StoreGetBrandsParams>
export const StoreGetBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(StoreGetBrandsParamsFields)

export type StoreGetBrandParamsType = z.infer<typeof StoreGetBrandParams>
export const StoreGetBrandParams = createSelectParams()
