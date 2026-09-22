import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import { VendorGetInquiriesParams } from "./validators"

export const vendorInquiriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/vendor/inquiries",
    middlewares: [
      validateAndTransformQuery(VendorGetInquiriesParams, {
        defaults: [
          "id",
          "store_name",
          "contact_number",
          "location",
          "product_id",
          "variant_id",
          "seller_id",
          "source_domain",
          "channel",
          "status",
          "created_at",
        ],
        isList: true,
      }),
    ],
  },
]
