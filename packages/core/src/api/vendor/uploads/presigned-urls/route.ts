import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"
import path from "path"
import { VendorUploadPreSignedUrlType } from "../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUploadPreSignedUrlType>,
  res: MedusaResponse
) => {
  const fileProvider = req.scope.resolve(Modules.FILE) as any

  if (typeof fileProvider.getUploadFileUrls !== "function") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "The configured file provider does not support generating presigned URLs"
    )
  }

  const sellerId =
    req.seller_context?.seller_id || (req.headers["x-seller-id"] as string)

  const rawName = req.validatedBody.originalname || "upload"
  const safeBaseName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, "_")
  const extension = path.extname(safeBaseName).replace(/^\./, "") || "bin"
  const uniqueFilename = `${randomUUID()}-${safeBaseName}`
  const fileKey = sellerId ? `sellers/${sellerId}/${uniqueFilename}` : uniqueFilename

  const response = await fileProvider.getUploadFileUrls({
    filename: fileKey,
    mimeType: req.validatedBody.mime_type,
    access: req.validatedBody.access ?? "public",
  })

  res.json({
    url: response.url,
    filename: response.key ?? fileKey,
    mime_type: req.validatedBody.mime_type,
    size: req.validatedBody.size,
    extension,
    originalname: req.validatedBody.originalname,
  })
}
