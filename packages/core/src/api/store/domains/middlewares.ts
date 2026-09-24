import { validateAndTransformQuery } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import { StoreGetDomainResolveParams } from "./validators"

export const storeDomainsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/domains/resolve",
    middlewares: [
      validateAndTransformQuery(StoreGetDomainResolveParams, {
        isList: false,
      }),
    ],
  },
]
