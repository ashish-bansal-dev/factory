import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BulkAiUploader } from "../../../../services/bulk-ai-upload/bulk-ai-uploader"

/**
 * POST /vendor/products/bulk-ai-upload
 * Vendor-authenticated bulk AI product creation.
 * Scoped to the authenticated vendor seller_id.
 */
export async function POST(req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) {
  try {
    const sellerId = (req as any).seller_context?.seller_id || (req.body as any)?.seller_id
    if (!sellerId) {
      return res.status(401).json({
        error: "Authenticated seller context required.",
      })
    }

    const body = req.body as {
      images?: Array<{
        base64?: string
        url?: string
        mimeType?: string
        originalName?: string
      }>
      notes?: string | string[]
    }

    if (!body.images || body.images.length === 0) {
      return res.status(400).json({
        error: "At least one image (base64 or url) is required.",
      })
    }

    const imageBuffers: Array<{ buffer: Buffer; mimeType?: string; originalName?: string }> = []
    for (const item of body.images) {
      if (item.base64) {
        const base64Data = item.base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
        imageBuffers.push({
          buffer,
          mimeType: item.mimeType || "image/jpeg",
          originalName: item.originalName,
        })
      } else if (item.url) {
        const fetchRes = await fetch(item.url)
        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch image from URL: ${item.url}`)
        }
        const arrayBuffer = await fetchRes.arrayBuffer()
        imageBuffers.push({
          buffer: Buffer.from(arrayBuffer),
          mimeType: item.mimeType || fetchRes.headers.get("content-type") || "image/jpeg",
          originalName: item.originalName,
        })
      }
    }

    if (imageBuffers.length === 0) {
      return res.status(400).json({
        error: "No valid image data could be extracted from the request payload.",
      })
    }

    const uploader = new BulkAiUploader(req.scope)
    const result = await uploader.processBatch({
      sellerId,
      images: imageBuffers,
      notes: body.notes,
    })

    return res.status(200).json({
      success: true,
      message: `Product "${result.product.title}" created successfully.`,
      ...result,
    })
  } catch (err: any) {
    console.error("[POST /vendor/products/bulk-ai-upload] Error:", err)
    return res.status(500).json({
      error: err.message || "Bulk AI product creation failed.",
    })
  }
}
