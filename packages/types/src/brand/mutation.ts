import { BrandStatus } from "./common"

export interface CreateBrandDTO {
  name: string
  handle?: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  status?: BrandStatus | string
  metadata?: Record<string, unknown> | null
}

export interface UpdateBrandDTO {
  name?: string
  handle?: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  status?: BrandStatus | string
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateBrandDTO extends CreateBrandDTO {
  seller_ids?: string[]
}

export interface AdminUpdateBrandDTO extends UpdateBrandDTO {
  seller_ids?: string[]
}

export interface VendorCreateBrandDTO {
  name: string
  handle?: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  metadata?: Record<string, unknown> | null
}
