'use server';

import { OfferDTO } from '@mercurjs/types';
import { headers as nextHeaders } from 'next/headers';

import { sdk } from '../client';
import { getAuthHeaders } from './cookies';
import { CACHE_TAGS, getGlobalCacheOptions } from './cache-tags';
import { getRegion } from './regions';
import { getSellerByHandle } from './seller';

// All fields are `+`-prefixed so they MERGE with the route defaults instead of
// replacing them. The defaults carry `product_variant.price_set.id` and the
// `inventory_item_link.*.location_levels` fields that the computed
// `calculated_price` / `inventory_quantity` depend on — dropping them (via an
// unprefixed field) silently yields null prices and zero stock.
const OFFER_FIELDS =
  '+seller.logo,+seller.banner,+seller.is_premium,' +
  '+calculated_price,+inventory_quantity,' +
  '+mrp,+bundle_size,+offer_type,' +
  '+product.id,+product.title,+product.handle,+product.thumbnail';

export const listOffers = async ({
  productId,
  sellerId,
  countryCode,
  regionId,
  limit,
  offset,
}: {
  productId?: string;
  sellerId?: string;
  countryCode?: string;
  regionId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ offers: OfferDTO[]; count: number }> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  let isTenant = false;
  let tenantHandle: string | null = null;
  try {
    const headersList = await nextHeaders();
    isTenant = headersList.get('x-is-tenant') === 'true';
    tenantHandle = headersList.get('x-tenant-handle');
  } catch {}

  let effectiveSellerId = sellerId;
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
      headers['x-seller-id'] = effectiveSellerId;
    }
  }

  const cacheTag =
    isTenant && tenantHandle
      ? `tenant-${tenantHandle}-${CACHE_TAGS.offers}`
      : CACHE_TAGS.offers;

  const next = getGlobalCacheOptions(
    cacheTag,
    productId ? CACHE_TAGS.productOffers(productId) : undefined
  );

  return (
    sdk.store.offers.query({
      product_id: productId,
      seller_id: effectiveSellerId,
      region_id: region?.id,
      country_code: countryCode,
      limit,
      offset,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers,
        cache: 'force-cache',
        next,
      },
    } as never) as unknown as Promise<{ offers: OfferDTO[]; count: number }>
  )
    .then(({ offers, count }) => ({ offers, count }))
    .catch(() => ({ offers: [], count: 0 }));
};

export const retrieveOffer = async (
  id: string,
  { countryCode, regionId }: { countryCode?: string; regionId?: string } = {}
): Promise<OfferDTO | null> => {
  const region = regionId
    ? { id: regionId }
    : countryCode
      ? await getRegion(countryCode)
      : null;

  return (
    sdk.store.offers.$id.query({
      $id: id,
      region_id: region?.id,
      country_code: countryCode,
      fields: OFFER_FIELDS,
      fetchOptions: {
        headers: { ...(await getAuthHeaders()) },
        cache: 'force-cache',
        next: getGlobalCacheOptions(CACHE_TAGS.offers, CACHE_TAGS.offer(id)),
      },
    } as never) as unknown as Promise<{ offer: OfferDTO }>
  )
    .then(({ offer }) => offer)
    .catch(() => null);
};
