import { authenticate, validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/medusa"
import { AdminGetInquiriesParams } from "./validators"

export const adminInquiriesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/inquiries",
    middlewares: [
      authenticate("user", ["session", "bearer", "api-key"]),
      validateAndTransformQuery(AdminGetInquiriesParams, {
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
