import "server-only"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export interface SellerDTO {
  id: string
  name: string
  handle: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  email?: string | null
  phone?: string | null
  website_url?: string | null
  is_premium?: boolean
  created_at?: string
  metadata?: Record<string, any> | null
}

const SELLER_FIELDS =
  "id,name,handle,description,logo,banner,is_premium,metadata,created_at,email,phone,website_url"

export const listSellers = async (params?: {
  limit?: number
  offset?: number
  q?: string
}): Promise<{ sellers: SellerDTO[]; count: number }> => {
  const headers = await getAuthHeaders()
  const next = await getCacheOptions("sellers")

  return sdk.client
    .fetch<{ sellers: SellerDTO[]; count: number }>(`/store/sellers`, {
      method: "GET",
      query: {
        limit: params?.limit || 50,
        offset: params?.offset || 0,
        fields: SELLER_FIELDS,
        ...(params?.q ? { q: params.q } : {}),
      },
      headers,
      next,
      cache: "force-cache",
    })
    .catch(() => ({ sellers: [], count: 0 }))
}

export const getSellerByHandle = async (
  handle: string
): Promise<SellerDTO | null> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{ sellers: SellerDTO[] }>(`/store/sellers`, {
      method: "GET",
      query: {
        handle,
        fields: SELLER_FIELDS,
      },
      headers,
      cache: "no-cache",
    })
    .then(({ sellers }) => sellers.find((s) => s.handle === handle) ?? sellers[0] ?? null)
    .catch(() => null)
}

export const getSellerById = async (
  id: string
): Promise<SellerDTO | null> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{ sellers: SellerDTO[] }>(`/store/sellers`, {
      method: "GET",
      query: {
        id,
        fields: SELLER_FIELDS,
      },
      headers,
      cache: "no-cache",
    })
    .then(({ sellers }) => sellers.find((s) => s.id === id) ?? null)
    .catch(() => null)
}

export const getSellerByCustomDomain = async (
  domain: string
): Promise<SellerDTO | null> => {
  const headers = await getAuthHeaders()
  const cleanDomain = domain.replace(/^[a-zA-Z]+:\/\//, "").trim().toLowerCase()

  return sdk.client
    .fetch<{ sellers: SellerDTO[] }>(`/store/sellers`, {
      method: "GET",
      query: {
        fields: SELLER_FIELDS,
        limit: 100,
      },
      headers,
      cache: "no-cache",
    })
    .then(({ sellers }) => {
      return (
        sellers.find((s) => {
          const customDomain = s.metadata?.domain_settings?.custom_domain
          if (!customDomain) return false
          const cleanCustom = String(customDomain)
            .replace(/^[a-zA-Z]+:\/\//, "")
            .trim()
            .toLowerCase()
          return cleanCustom === cleanDomain
        }) ?? null
      )
    })
    .catch(() => null)
}

export const getTenantSeller = async (
  handle?: string | null,
  customDomain?: string | null
): Promise<SellerDTO | null> => {
  if (handle) {
    const seller = await getSellerByHandle(handle)
    if (seller) return seller
  }
  if (customDomain) {
    const seller = await getSellerByCustomDomain(customDomain)
    if (seller) return seller
  }
  return null
}

