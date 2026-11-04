import { requireAnyPermission } from "../../utils"
import { validateAndTransformBody } from "@medusajs/framework"
import multer from "multer"
import { extname } from "path"

import { MiddlewareRoute } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { VendorUploadPreSignedUrl } from "./validators"

const ALLOWED_UPLOADS: Record<string, readonly string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/heic": [".heic"],
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 20,
  },
  fileFilter: (_req, file, callback) => {
    const mimeType = file.mimetype?.split(";")[0].trim().toLowerCase() ?? ""
    const extension = extname(file.originalname ?? "").toLowerCase()
    const extensions = ALLOWED_UPLOADS[mimeType]

    if (!extensions || !extensions.includes(extension)) {
      return callback(
        new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `File "${file.originalname}" is not an allowed upload type`
        )
      )
    }

    callback(null, true)
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
