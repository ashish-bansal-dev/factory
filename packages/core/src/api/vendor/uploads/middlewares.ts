import { requireAnyPermission } from "../../utils"
import { validateAndTransformBody } from "@medusajs/framework"
import multer from "multer"

import { MiddlewareRoute } from "@medusajs/framework/http"
import { VendorUploadPreSignedUrl } from "./validators"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 20,
  },
})

export const vendorUploadsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/vendor/uploads",
    middlewares: [
      // Product media and the store logo/banner both upload through here.
      requireAnyPermission([
        { key: "products", right: "edit" },
        { key: "store", right: "edit" },
      ]),
      upload.array("files"),
    ],
  },
  {
    method: ["POST"],
    matcher: "/vendor/uploads/presigned-urls",
    middlewares: [
      requireAnyPermission([
        { key: "products", right: "edit" },
        { key: "store", right: "edit" },
      ]),
      validateAndTransformBody(VendorUploadPreSignedUrl),
    ],
  },
]
