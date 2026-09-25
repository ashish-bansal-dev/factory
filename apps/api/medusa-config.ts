import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const isR2Configured = Boolean(
  (process.env.R2_BUCKET || process.env.S3_BUCKET) &&
  (process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID)
)

const fileProviders: Record<string, unknown>[] = isR2Configured
  ? [
      {
        resolve: '@medusajs/medusa/file-s3',
        id: 's3',
        is_default: true,
        options: {
          file_url: (
            process.env.R2_FILE_URL ||
            process.env.R2_PUBLIC_URL ||
            process.env.S3_FILE_URL ||
            ''
          ).replace(/\/+$/, ''),
          access_key_id: process.env.R2_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID,
          secret_access_key: process.env.R2_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY,
          region: process.env.R2_REGION || process.env.S3_REGION || 'auto',
          bucket: process.env.R2_BUCKET || process.env.S3_BUCKET,
          endpoint: process.env.R2_ENDPOINT || process.env.S3_ENDPOINT,
          prefix: process.env.R2_PREFIX || process.env.S3_PREFIX || '',
          cache_control: process.env.R2_CACHE_CONTROL || process.env.S3_CACHE_CONTROL || 'public, max-age=31536000',
          acl: false,
          additional_client_config: {
            forcePathStyle: true,
          },
        },
      },
    ]
  : [
      {
        resolve: '@medusajs/medusa/file-local',
        id: 'local',
        is_default: true,
        options: {
          backend_url: process.env.FILE_BACKEND_URL || 'http://localhost:9000/static',
        },
      },
    ]

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      vendorCors: process.env.VENDOR_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: '',
        path: '/dashboard',
        disable: true
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: '',
        path: '/seller',
        disable: true
      }
    },
    {
      resolve: '@medusajs/medusa/cache-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: { redis: { url: REDIS_URL } },
    },
    {
      resolve: '@medusajs/medusa/locking',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/locking-redis',
            id: 'locking-redis',
            is_default: true,
            options: { redisUrl: REDIS_URL },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: fileProviders,
      },
    },
  ],
})
