import {
  AuthenticatedMedusaRequest,
  maybeApplyLinkFilter,
  MedusaNextFunction,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import brandSeller from "../../../links/brand-seller-link"
import { vendorBrandQueryConfig } from "./query-config"
import {
  VendorCreateBrand,
  VendorGetBrandsParams,
} from "./validators"

const applySellerBrandLinkFilter = (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  req.filterableFields.seller_id = req.seller_context!.seller_id

  return maybeApplyLinkFilter({
    entryPoint: brandSeller.entryPoint,
    resourceId: "brand_id",
    filterableField: "seller_id",
  })(req, res, next)
}

export const vendorBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/brands",
    middlewares: [
      validateAndTransformQuery(
        VendorGetBrandsParams,
        vendorBrandQueryConfig.list
      ),
      applySellerBrandLinkFilter,
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/brands",
    middlewares: [
      validateAndTransformQuery(
        VendorGetBrandsParams,
        vendorBrandQueryConfig.retrieve
      ),
      validateAndTransformBody(VendorCreateBrand),
    ],
  },
  {
    method: ["GET"],
    matcher: "/vendor/brands/:id",
    middlewares: [
      validateAndTransformQuery(
        VendorGetBrandsParams,
        vendorBrandQueryConfig.retrieve
      ),
      applySellerBrandLinkFilter,
    ],
  },
]
