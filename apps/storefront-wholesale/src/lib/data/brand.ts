import "server-only"
import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"

export interface BrandDTO {
  id: string
  name: string
  handle: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  website_url?: string | null
  status?: string
  metadata?: Record<string, any> | null
  sellers?: Array<{ id: string; name: string; handle: string; logo?: string }>
  products?: Array<{ id: string; title: string; handle: string; thumbnail?: string }>
}

export const listBrands = async (params?: {
  limit?: number
  offset?: number
  q?: string
}): Promise<{ brands: BrandDTO[]; count: number }> => {
  const headers = await getAuthHeaders()
  const next = await getCacheOptions("brands")

  return sdk.client
    .fetch<{ brands: BrandDTO[]; count: number }>(`/store/brands`, {
      method: "GET",
      query: {
        limit: params?.limit || 50,
        offset: params?.offset || 0,
        ...(params?.q ? { q: params.q } : {}),
      },
      headers,
      next,
      cache: "force-cache",
    })
    .catch(() => ({ brands: [], count: 0 }))
}

export const getBrandByHandle = async (
  handle: string
): Promise<BrandDTO | null> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{ brand: BrandDTO }>(`/store/brands/${handle}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then(({ brand }) => brand)
    .catch(() => null)
}
