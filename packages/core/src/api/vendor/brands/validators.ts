import { z } from "zod"
import { BrandStatus } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"

export const VendorGetBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.string().optional(),
    status: z.union([z.nativeEnum(BrandStatus), z.array(z.nativeEnum(BrandStatus)), z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
export type VendorGetBrandsParamsType = z.infer<typeof VendorGetBrandsParams>

export const VendorCreateBrand = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
export type VendorCreateBrandType = z.infer<typeof VendorCreateBrand>
