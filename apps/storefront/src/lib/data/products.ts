'use server';

import { HttpTypes } from '@medusajs/types';
import { headers as nextHeaders } from 'next/headers';

import { sortProducts } from '@/lib/helpers/sort-products';
import { SortOptions } from '@/types/product';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import { getRegion, retrieveRegion } from './regions';
import { getSellerByHandle } from './seller';

const PRODUCT_LIST_FIELDS =
  '*variants.calculated_price,+variants.inventory_quantity,*variants.options,*attribute_values,*attribute_values.attribute';

export type SearchFacetBucket = { value: string; count: number };

/**
 * Storefront filter facets. `attributes` is keyed by the global product
 * attribute handle (e.g. `size`, `color`, `condition`); each entry is the list
 * of selectable values. Backed by `GET /store/product-attributes`.
 */
export type SearchFacets = {
  attributes: Record<string, SearchFacetBucket[]>;
};

type StoreProductAttribute = {
  handle: string;
  name: string;
  is_variant_axis: boolean;
  values?: { name: string; rank?: number }[];
};

export const getSearchFacets = async (): Promise<SearchFacets> => {
  const { product_attributes } = await (
    sdk.store.productAttributes.query({
      is_filterable: true,
      limit: 100,
      fields: 'handle,name,is_variant_axis,values.name,values.rank',
      fetchOptions: { next: { revalidate: 300 } },
    } as never) as unknown as Promise<{
      product_attributes: StoreProductAttribute[];
    }>
  ).catch(() => ({ product_attributes: [] as StoreProductAttribute[] }));

  const attributes: Record<string, SearchFacetBucket[]> = {};
  for (const attribute of product_attributes) {
    attributes[attribute.handle] = (attribute.values ?? [])
      .slice()
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((value) => ({
        value: value.name,
        count: 1,
      }));
  }

  return { attributes };
};

/**
 * Products in Mercur are master products from a single shared catalog — they are
 * not owned by a seller. Seller-scoped listings and per-seller price/inventory
 * come from offers, not from a product→seller relation; use `lib/data/offers.ts`.
 */
export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  category_id,
  collection_id,
}: {
  pageParam?: number;
  queryParams?: HttpTypes.FindParams &
    HttpTypes.StoreProductParams & { handle?: string[]; seller_id?: string };
  category_id?: string | string[];
  collection_id?: string;
  countryCode?: string;
  regionId?: string;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  if (!countryCode && !regionId) {
    throw new Error('Country code or region ID is required');
  }

  const limit = queryParams?.limit || 12;
  const _pageParam = Math.max(pageParam, 1);
  const offset = (_pageParam - 1) * limit;

  const region = countryCode
    ? await getRegion(countryCode)
    : await retrieveRegion(regionId!);

  if (!region) {
    return { response: { products: [], count: 0 }, nextPage: null };
  }

  let isTenant = false;
  let tenantHandle: string | null = null;
  try {
    const headersList = await nextHeaders();
    isTenant = headersList.get('x-is-tenant') === 'true';
    tenantHandle = headersList.get('x-tenant-handle');
  } catch {}

  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = { ...authHeaders };

  const effectiveQueryParams: Record<string, unknown> = {
    category_id,
    collection_id,
    limit,
    offset,
    region_id: region.id,
    fields: PRODUCT_LIST_FIELDS,
    ...queryParams,
  };

  if (isTenant && tenantHandle) {
    headers['x-tenant-handle'] = tenantHandle;
    headers['x-is-tenant'] = 'true';
    if (!effectiveQueryParams.seller_id) {
      const seller = await getSellerByHandle(tenantHandle).catch(() => null);
      if (seller) {
        effectiveQueryParams.seller_id = seller.id;
        headers['x-seller-id'] = seller.id;
      }
    } else {
      headers['x-seller-id'] = effectiveQueryParams.seller_id as string;
    }
  } else if (effectiveQueryParams.seller_id) {
    headers['x-seller-id'] = effectiveQueryParams.seller_id as string;
  }


  const cacheTag =
    isTenant && tenantHandle
      ? `tenant-${tenantHandle}-${CACHE_TAGS.products}`
      : CACHE_TAGS.products;

  return (
    sdk.store.products.query({
      ...effectiveQueryParams,
      fetchOptions: {
        headers,
        cache: 'force-cache',
        next: getGlobalCacheOptions(cacheTag),
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[]; count: number }>
  )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null;

      return {
        response: { products, count },
        nextPage,
        queryParams,
      };
    })
    .catch(() => ({
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }));
};

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = 'created_at',
  countryCode,
  category_id,
  collection_id,
  seller_id,
}: {
  page?: number;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
  sortBy?: SortOptions;
  countryCode: string;
  category_id?: string | string[];
  collection_id?: string;
  seller_id?: string;
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number };
  nextPage: number | null;
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams;
}> => {
  const limit = queryParams?.limit || 12;

  const {
    response: { products, count },
  } = await listProducts({
    pageParam: 0,
    queryParams: { ...queryParams, seller_id, limit: 100 },
    category_id,
    collection_id,
    countryCode,
  });

  const sortedProducts = sortProducts(products, sortBy);

  const pageParam = (page - 1) * limit;
  const nextPage = count > pageParam + limit ? pageParam + limit : null;
  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit);

  return {
    response: { products: paginatedProducts, count },
    nextPage,
    queryParams,
  };
};

export const getProductByHandle = async (handle: string, regionId: string) => {
  const next = getGlobalCacheOptions(
    CACHE_TAGS.products,
    CACHE_TAGS.product(handle)
  );

  return (
    sdk.store.products.query({
      handle,
      region_id: regionId,
      fields: PRODUCT_LIST_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next,
      },
    } as never) as unknown as Promise<{ products: HttpTypes.StoreProduct[] }>
  ).then(({ products }) => products[0]);
};

/**
 * Price sorts are applied client-side because `/store/products` can only order
 * by product columns.
 */
export const searchProducts = async ({
  query,
  countryCode,
  regionId,
  category_id,
  collection_id,
  seller_id,
  attributes,
  page = 1,
  limit = 12,
  sortBy,
}: {
  query?: string;
  countryCode?: string;
  regionId?: string;
  category_id?: string | string[];
  collection_id?: string | string[];
  seller_id?: string | string[];
  attributes?: Record<string, string | string[]>;
  page?: number;
  limit?: number;
  sortBy?: SortOptions;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  nextPage: number | null;
}> => {
  const region = countryCode ? await getRegion(countryCode) : { id: regionId };

  if (!region?.id) {
    return { products: [], count: 0, nextPage: null };
  }

  const offset = Math.max(page - 1, 0) * limit;
  const order = !sortBy || sortBy === 'created_at' ? '-created_at' : undefined;

  const hasAttributeFilters =
    attributes && Object.keys(attributes).length > 0;

  let isTenant = false;
  let tenantHandle: string | null = null;
  try {
    const headersList = await nextHeaders();
    isTenant = headersList.get('x-is-tenant') === 'true';
    tenantHandle = headersList.get('x-tenant-handle');
  } catch {}

  let effectiveSellerId = seller_id;
  const authHeaders = await getAuthHeaders();
  const headers: Record<string, string> = { ...authHeaders };

  if (isTenant && tenantHandle) {
    headers['x-tenant-handle'] = tenantHandle;
    headers['x-is-tenant'] = 'true';
    if (!effectiveSellerId) {
      const seller = await getSellerByHandle(tenantHandle).catch(() => null);
      if (seller) {
        effectiveSellerId = seller.id;
        headers['x-seller-id'] = seller.id;
      }
    } else {
      headers['x-seller-id'] = Array.isArray(effectiveSellerId)
        ? effectiveSellerId[0]
        : effectiveSellerId;
    }
  } else if (effectiveSellerId) {
    headers['x-seller-id'] = Array.isArray(effectiveSellerId)
      ? effectiveSellerId[0]
      : effectiveSellerId;
  }

  const { products, count } = await (sdk.store.products.query({
    q: query || undefined,
    region_id: region.id,
    category_id,
    collection_id,
    seller_id: effectiveSellerId,
    attributes: hasAttributeFilters ? attributes : undefined,
    order,
    limit,
    offset,
    fields: PRODUCT_LIST_FIELDS,
    fetchOptions: { headers, cache: 'no-cache' },
  } as never) as unknown as Promise<{
    products: HttpTypes.StoreProduct[];
    count: number;
  }>).catch(() => ({
    products: [] as HttpTypes.StoreProduct[],
    count: 0,
  }));

  const ordered =
    sortBy === 'price_asc' || sortBy === 'price_desc'
      ? sortProducts(products, sortBy)
      : products;

  const nextPage = count > offset + limit ? page + 1 : null;

  return { products: ordered, count, nextPage };
};

