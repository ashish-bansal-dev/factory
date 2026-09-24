import { createClient, InferClient } from '@mercurjs/client';

export type ClientRoute = {
  query: <T = Record<string, unknown>>(i?: Record<string, unknown> | never) => Promise<T>;
  mutate: <T = Record<string, unknown>>(i?: Record<string, unknown> | never) => Promise<T>;
  delete: <T = Record<string, unknown>>(i?: Record<string, unknown> | never) => Promise<T>;
} & { [k: string]: ClientRoute };

const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

export const sdk: ClientRoute = createClient({
  baseUrl: MEDUSA_BACKEND_URL,
  fetchOptions: {
    headers: {
      'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
      'x-channel': 'retail',
    },
  },
}) as unknown as ClientRoute;
