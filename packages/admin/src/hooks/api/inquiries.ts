import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryKeysFactory } from "../../lib/query-key-factory"

export type WholesaleInquiryDTO = {
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

export type AdminInquiriesResponse = {
  inquiries: WholesaleInquiryDTO[]
  count: number
  offset: number
  limit: number
}

const INQUIRIES_QUERY_KEY = "inquiries" as const
export const inquiriesQueryKeys = queryKeysFactory(INQUIRIES_QUERY_KEY)

export const useInquiries = (
  query?: Record<string, unknown>,
  options?: Omit<
    UseQueryOptions<AdminInquiriesResponse, Error, AdminInquiriesResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: inquiriesQueryKeys.list(query),
    queryFn: async () => {
      return (await fetchQuery("/admin/inquiries", {
        method: "GET",
        query: query as Record<string, string | number | object>,
      })) as AdminInquiriesResponse
    },
    ...options,
  })

  return { ...data, ...rest }
}
