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

const ADMIN_DOMAINS_QUERY_KEY = "admin_domains" as const
export const adminDomainQueryKeys = queryKeysFactory(ADMIN_DOMAINS_QUERY_KEY)

export type AdminSellerDomainsResponse = {
  domains: DomainMappingDTO[]
  domain_mappings?: DomainMappingDTO[]
  count: number
  offset: number
  limit: number
}

export type AdminDomainResponse = {
  domain: DomainMappingDTO
  domain_mapping?: DomainMappingDTO
}

export type AdminCheckDnsResponse = {
  verified: boolean
  domain: DomainMappingDTO
  domain_mapping?: DomainMappingDTO
  status: string
  message: string
  records?: string[]
}

export type AdminCreateDomainPayload = {
  domain: string
  channel_type?: "retail" | "wholesale"
  is_custom_domain?: boolean
  verification_status?: "pending" | "verified" | "failed"
  branding_config?: Record<string, unknown> | null
  subscription_status?: "active" | "inactive" | "trial"
}

export type AdminUpdateDomainPayload = {
  domain?: string
  channel_type?: "retail" | "wholesale"
  is_custom_domain?: boolean
  verification_status?: "pending" | "verified" | "failed"
  branding_config?: Record<string, unknown> | null
  subscription_status?: "active" | "inactive" | "trial"
}

export const useAdminSellerDomains = (
  sellerId: string,
  query?: Record<string, string | number>,
  options?: Omit<
    UseQueryOptions<
      AdminSellerDomainsResponse,
      Error,
      AdminSellerDomainsResponse,
      readonly unknown[]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryFn: () =>
      fetchQuery(`/admin/sellers/${sellerId}/domains`, {
        method: "GET",
        query,
      }),
    queryKey: adminDomainQueryKeys.detail(sellerId, query),
    enabled: !!sellerId,
    ...options,
  })

  return { ...data, ...rest }
}

export const useAdminCreateSellerDomain = (
  sellerId: string,
  options?: UseMutationOptions<AdminDomainResponse, Error, AdminCreateDomainPayload>,
) => {
  return useMutation({
    mutationFn: (payload) =>
      fetchQuery(`/admin/sellers/${sellerId}/domains`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminDomainQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAdminCheckSellerDomainDns = (
  sellerId: string,
  options?: UseMutationOptions<AdminCheckDnsResponse, Error, { domainId: string }>,
) => {
  return useMutation({
    mutationFn: ({ domainId }) =>
      fetchQuery(`/admin/sellers/${sellerId}/domains/${domainId}/check-dns`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminDomainQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAdminVerifySellerDomain = (
  sellerId: string,
  options?: UseMutationOptions<AdminDomainResponse, Error, { domainId: string }>,
) => {
  return useMutation({
    mutationFn: ({ domainId }) =>
      fetchQuery(`/admin/sellers/${sellerId}/domains/${domainId}/verify`, {
        method: "POST",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminDomainQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAdminUpdateSellerDomain = (
  sellerId: string,
  options?: UseMutationOptions<
    AdminDomainResponse,
    Error,
    { domainId: string; payload: AdminUpdateDomainPayload }
  >,
) => {
  return useMutation({
    mutationFn: ({ domainId, payload }) =>
      fetchQuery(`/admin/sellers/${sellerId}/domains/${domainId}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminDomainQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}

export const useAdminDeleteSellerDomain = (
  sellerId: string,
  options?: UseMutationOptions<
    { id: string; object: string; deleted: boolean },
    Error,
    { domainId: string }
  >,
) => {
  return useMutation({
    mutationFn: ({ domainId }) =>
      fetchQuery(`/admin/sellers/${sellerId}/domains/${domainId}`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminDomainQueryKeys.details() })
      options?.onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
