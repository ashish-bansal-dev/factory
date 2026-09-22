import { validateAndTransformQuery } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"

import * as QueryConfig from "./query-config"
import { StoreGetBrandsParams, StoreGetBrandParams } from "./validators"

export const storeBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/brands",
    middlewares: [
      validateAndTransformQuery(
        StoreGetBrandsParams,
        QueryConfig.listBrandQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/brands/:handle",
    middlewares: [
      validateAndTransformQuery(
        StoreGetBrandParams,
        QueryConfig.retrieveBrandQueryConfig
      ),
    ],
  },
]
