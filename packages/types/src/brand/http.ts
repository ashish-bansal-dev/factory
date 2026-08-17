import { PaginatedResponse } from "@medusajs/types"
import { BrandDTO } from "./common"

export interface AdminBrandResponse {
  brand: BrandDTO
}

export type AdminBrandListResponse = PaginatedResponse<{
  brands: BrandDTO[]
}>

export interface VendorBrandResponse {
  brand: BrandDTO
}

export type VendorBrandListResponse = PaginatedResponse<{
  brands: BrandDTO[]
}>
