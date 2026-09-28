import { z } from "zod"
import { BrandStatus } from "@mercurjs/types"
import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators"

export const AdminGetBrandsParams = createFindParams({
  offset: 0,
  limit: 50,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
    handle: z.string().optional(),
    status: z.union([z.nativeEnum(BrandStatus), z.array(z.nativeEnum(BrandStatus)), z.string(), z.array(z.string())]).optional(),
    seller_id: z.union([z.string(), z.array(z.string())]).optional(),
    created_at: createOperatorMap().optional(),
    updated_at: createOperatorMap().optional(),
  })
)
export type AdminGetBrandsParamsType = z.infer<typeof AdminGetBrandsParams>

export const AdminCreateBrand = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  status: z.nativeEnum(BrandStatus).optional().default(BrandStatus.APPROVED),
  seller_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
export type AdminCreateBrandType = z.infer<typeof AdminCreateBrand>

export const AdminUpdateBrand = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  description: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  website_url: z.string().nullable().optional(),
  status: z.nativeEnum(BrandStatus).optional(),
  seller_ids: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
})
export type AdminUpdateBrandType = z.infer<typeof AdminUpdateBrand>

export const AdminManageBrandSellers = z.object({
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
})
export type AdminManageBrandSellersType = z.infer<typeof AdminManageBrandSellers>
