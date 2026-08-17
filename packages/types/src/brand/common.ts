import { SellerDTO } from "../seller/common"

export enum BrandStatus {
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface BrandDTO {
  id: string
  name: string
  handle: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  status: BrandStatus | string
  metadata?: Record<string, unknown> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
  sellers?: SellerDTO[]
}
