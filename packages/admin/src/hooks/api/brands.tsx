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
  AdminBrandListResponse,
  AdminBrandResponse,
  AdminCreateBrandDTO,
  AdminUpdateBrandDTO,
} from "@mercurjs/types";

const BRAND_QUERY_KEY = "brands" as const;
export const brandsQueryKeys = queryKeysFactory(BRAND_QUERY_KEY);

export const useBrand = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBrandResponse,
      ClientError,
      AdminBrandResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.detail(id, query),
    queryFn: () => sdk.admin.brands.$id.query({ $id: id, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useBrands = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBrandListResponse,
      ClientError,
      AdminBrandListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >,
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: () => sdk.admin.brands.query(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateBrand = (
  options?: UseMutationOptions<
    AdminBrandResponse,
    ClientError,
    AdminCreateBrandDTO
  >,
) => {
  return useMutation({
    mutationFn: (payload) => sdk.admin.brands.mutate(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateBrand = (
  id: string,
  options?: UseMutationOptions<
    AdminBrandResponse,
    ClientError,
    AdminUpdateBrandDTO
  >,
) => {
  return useMutation({
    mutationFn: (payload) =>
      sdk.admin.brands.$id.mutate({ $id: id, ...payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandsQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useApproveBrand = (
  id: string,
  options?: UseMutationOptions<
    AdminBrandResponse,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.brands.$id.approve.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandsQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useRejectBrand = (
  id: string,
  options?: UseMutationOptions<
    AdminBrandResponse,
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () =>
      sdk.admin.brands.$id.reject.mutate({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandsQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteBrand = (
  id: string,
  options?: UseMutationOptions<
    { id: string; object: string; deleted: boolean },
    ClientError,
    void
  >,
) => {
  return useMutation({
    mutationFn: () => sdk.admin.brands.$id.delete({ $id: id }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandsQueryKeys.detail(id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
