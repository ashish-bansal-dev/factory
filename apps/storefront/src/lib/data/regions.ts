'use server';

import { HttpTypes } from '@medusajs/types';

import medusaError from '@/lib/helpers/medusa-error';

import { sdk } from '../client';
import { getCacheOptions } from './cookies';

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const next = {
    ...(await getCacheOptions('regions')),
    revalidate: 3600,
  };

  return sdk.store.regions
    .query<{ regions: HttpTypes.StoreRegion[] }>({ fetchOptions: { next, cache: 'force-cache' } })
    .then(({ regions }) => regions ?? [])
    .catch((err) => {
      medusaError(err);
      return [];
    });
};

export const retrieveRegion = async (id: string): Promise<HttpTypes.StoreRegion | null> => {
  const next = {
    ...(await getCacheOptions(['regions', id].join('-'))),
    revalidate: 3600,
  };

  return sdk.store.regions.$id
    .query<{ region: HttpTypes.StoreRegion }>({ $id: id, fetchOptions: { next, cache: 'force-cache' } })
    .then(({ region }) => region)
    .catch((err) => {
      medusaError(err);
      return null;
    });
};

const regionMap = new Map<string, HttpTypes.StoreRegion>();

export const getRegion = async (countryCode: string): Promise<HttpTypes.StoreRegion | null> => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode) ?? null;
    }

    const regions = await listRegions();

    if (!regions || !regions.length) {
      return null;
    }

    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? '', region);
      });
    });

    return regionMap.get(countryCode) ?? regionMap.get('us') ?? null;
  } catch (e) {
    return null;
  }
};
