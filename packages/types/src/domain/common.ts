import { SellerDTO } from "../seller/common"

export type DomainChannelType = "retail" | "wholesale"
export type DomainVerificationStatus = "pending" | "verified" | "failed"
export type DomainSubscriptionStatus = "active" | "inactive" | "trial"

export interface DomainBrandingConfig {
  brand_name?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  accent_color?: string
  font_family?: string
  custom_css?: string
  [key: string]: unknown
}

export interface DomainMappingDTO {
  id: string
  seller_id: string
  domain: string
  channel_type: DomainChannelType
  is_custom_domain: boolean
  verification_status: DomainVerificationStatus
  verification_token: string | null
  verified_at: Date | null
  subscription_status: DomainSubscriptionStatus
  branding_config: DomainBrandingConfig | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
  seller?: SellerDTO
}

export interface FilterableDomainMappingProps {
  id?: string | string[]
  seller_id?: string | string[]
  domain?: string | string[]
  channel_type?: DomainChannelType
  is_custom_domain?: boolean
  verification_status?: DomainVerificationStatus
  subscription_status?: DomainSubscriptionStatus
}
