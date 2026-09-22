import path from "path"
import { uploadFilesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminUploadFile>,
  res: MedusaResponse
) => {
  const input = req.files as Express.Multer.File[]

  if (!input?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No files were uploaded"
    )
  }

  const sellerId =
    req.seller_context?.seller_id || (req.headers["x-seller-id"] as string)

  const { result: files } = await uploadFilesWorkflow(req.scope).run({
    input: {
      files: input?.map((f: any) => {
        const rawName = f.originalname || "upload"
        const safeBaseName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, "_")
        const filename = sellerId ? `sellers/${sellerId}/${safeBaseName}` : safeBaseName

        return {
          filename,
          mimeType: f.mimetype,
          content: f.buffer.toString("base64"),
          access: "public",
        }
      }),
    },
  })

  res.json({ files })
}
