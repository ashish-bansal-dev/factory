import {
  DomainBrandingConfig,
  DomainChannelType,
  DomainSubscriptionStatus,
  DomainVerificationStatus,
} from "./common"

export interface CreateDomainMappingDTO {
  seller_id: string
  domain: string
  channel_type?: DomainChannelType
  is_custom_domain?: boolean
  verification_status?: DomainVerificationStatus
  verification_token?: string | null
  verified_at?: Date | null
  subscription_status?: DomainSubscriptionStatus
  branding_config?: DomainBrandingConfig | null
}

export interface UpdateDomainMappingDTO {
  id: string
  domain?: string
  channel_type?: DomainChannelType
  is_custom_domain?: boolean
  verification_status?: DomainVerificationStatus
  verification_token?: string | null
  verified_at?: Date | null
  subscription_status?: DomainSubscriptionStatus
  branding_config?: DomainBrandingConfig | null
}
