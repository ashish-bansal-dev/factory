import { validateAndTransformBody, validateAndTransformQuery } from "@medusajs/framework"
import { maybeApplyLinkFilter } from "@medusajs/framework/http"
import { MiddlewareRoute } from "@medusajs/medusa"
import brandSeller from "../../../links/brand-seller-link"
import { adminBrandQueryConfig } from "./query-config"
import {
  AdminCreateBrand,
  AdminGetBrandsParams,
  AdminManageBrandSellers,
  AdminUpdateBrand,
} from "./validators"

export const adminBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/brands",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.list),
      maybeApplyLinkFilter({
        entryPoint: brandSeller.entryPoint,
        resourceId: "brand_id",
        filterableField: "seller_id",
      }),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
      validateAndTransformBody(AdminCreateBrand),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/brands/:id",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
      validateAndTransformBody(AdminUpdateBrand),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id/approve",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id/reject",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id/sellers",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandsParams, adminBrandQueryConfig.retrieve),
      validateAndTransformBody(AdminManageBrandSellers),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/brands/:id",
    middlewares: [],
  },
]
