import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export type VendorInquiryDTO = {
  id: string
  store_name: string
  contact_number: string
  location: string
  product_id: string
  variant_id?: string | null
  seller_id?: string | null
  source_domain?: string | null
  channel: string
  status: string
  metadata?: {
    notes?: string | null
    quantity?: number | null
    [key: string]: unknown
  } | null
  created_at: string
  updated_at: string
}

export type VendorInquiriesResponse = {
  inquiries: VendorInquiryDTO[]
  count: number
  offset: number
  limit: number
}

const VENDOR_INQUIRIES_QUERY_KEY = "vendor_inquiries" as const
export const vendorInquiriesQueryKeys = queryKeysFactory(VENDOR_INQUIRIES_QUERY_KEY)

export const useVendorInquiries = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<VendorInquiriesResponse, Error, VendorInquiriesResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: vendorInquiriesQueryKeys.list(query),
    queryFn: async () => {
      return (await fetchQuery("/vendor/inquiries", {
        method: "GET",
        query: query as Record<string, string | number | object>,
      })) as VendorInquiriesResponse
    },
    ...options,
  })

  return { ...data, ...rest }
}
