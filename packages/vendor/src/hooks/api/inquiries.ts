import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
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
    product_title?: string | null
    draft_order_id?: string | null
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

export type ConvertInquiryItemPayload = {
  variant_id: string
  quantity: number
  unit_price: number
  title?: string
  metadata?: Record<string, unknown>
}

export type ConvertInquiryToDraftOrderPayload = {
  items: ConvertInquiryItemPayload[]
  shipping_amount?: number
  notes?: string
  currency_code?: string
  email?: string
  customer_id?: string
  region_id?: string
  metadata?: Record<string, unknown>
}

export type ConvertInquiryResponse = {
  draft_order: Record<string, unknown>
  inquiry: VendorInquiryDTO
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

export const useConvertInquiryToDraftOrder = (
  inquiryId: string,
  options?: UseMutationOptions<
    ConvertInquiryResponse,
    Error,
    ConvertInquiryToDraftOrderPayload
  >
) => {
  return useMutation({
    mutationFn: (payload: ConvertInquiryToDraftOrderPayload) =>
      fetchQuery(`/vendor/inquiries/${inquiryId}/create-draft-order`, {
        method: "POST",
        body: payload,
      }) as Promise<ConvertInquiryResponse>,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: vendorInquiriesQueryKeys.all,
      })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
