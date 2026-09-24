import { DomainMappingDTO } from "@mercurjs/types"
import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"

import { fetchQuery } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const DOMAINS_QUERY_KEY = "domains" as const
export const domainQueryKeys = queryKeysFactory(DOMAINS_QUERY_KEY)

export type VendorDomainsResponse = {
  domains: DomainMappingDTO[]
  domain_mappings?: DomainMappingDTO[]
  count: number
  offset: number
  limit: number
}

export type VendorDomainResponse = {
  domain: DomainMappingDTO
  domain_mapping?: DomainMappingDTO
}

export type VendorCheckDnsResponse = {
  verified: boolean
  domain: DomainMappingDTO
  domain_mapping?: DomainMappingDTO
  status: string
  message: string
  records?: string[]
}

export type CreateDomainPayload = {
  domain: string
  channel_type?: "retail" | "wholesale"
  is_custom_domain?: boolean
  branding_config?: Record<string, unknown> | null
}

export const useVendorDomains = (
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      VendorDomainsResponse,
      Error,
      VendorDomainsResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery("/vendor/domains", { method: "GET", query }),
    queryKey: domainQueryKeys.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useVendorCreateDomain = (
  options?: UseMutationOptions<VendorDomainResponse, Error, CreateDomainPayload>,
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery("/vendor/domains", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useVendorCheckDomainDns = (
  options?: UseMutationOptions<
    VendorCheckDnsResponse,
    Error,
    { domainId: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ domainId }) =>
      fetchQuery(`/vendor/domains/${domainId}/check-dns`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useVendorDeleteDomain = (
  options?: UseMutationOptions<
    { id: string; object: string; deleted: boolean },
    Error,
    { domainId: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ domainId }) =>
      fetchQuery(`/vendor/domains/${domainId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: domainQueryKeys.lists() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
