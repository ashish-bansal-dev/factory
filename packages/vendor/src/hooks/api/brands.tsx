import { ClientError } from "@mercurjs/client";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import {
  VendorBrandListResponse,
  VendorBrandResponse,
  VendorCreateBrandDTO,
} from "@mercurjs/types";

const BRAND_QUERY_KEY = "brands" as const;
export const brandsQueryKeys = queryKeysFactory(BRAND_QUERY_KEY);

export const useBrand = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      VendorBrandResponse,
      ClientError,
      VendorBrandResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.detail(id, query),
    queryFn: () => sdk.vendor.brands.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useBrands = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      VendorBrandListResponse,
      ClientError,
      VendorBrandListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: () => sdk.vendor.brands.query(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateBrand = (
  options?: UseMutationOptions<
    VendorBrandResponse,
    ClientError,
    VendorCreateBrandDTO
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.vendor.brands.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
