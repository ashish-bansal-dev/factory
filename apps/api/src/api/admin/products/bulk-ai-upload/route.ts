import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BulkAiUploader } from "../../../../services/bulk-ai-upload/bulk-ai-uploader"

/**
 * POST /admin/products/bulk-ai-upload
 * Bulk AI ingestion for a batch of images:
 * 1. Compresses batch of images to WebP.
 * 2. Feeds all images to Gemini Vision in a single pass to extract article title, description, brand, and pricing.
 * 3. Resolves or creates approved Brand.
 * 4. Creates wholesale product for target vendor with only default variant.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as {
      seller_id?: string
      images?: Array<{
        base64?: string
        url?: string
        mimeType?: string
        originalName?: string
      }>
      notes?: string | string[]
    }

    const sellerId = body.seller_id
    if (!sellerId) {
      return res.status(400).json({
        error: "seller_id is required to associate created products with a vendor.",
      })
    }

    if (!body.images || body.images.length === 0) {
      return res.status(400).json({
        error: "At least one image (base64 or url) is required.",
      })
    }

    // Convert images to Buffer array
    const imageBuffers: Array<{ buffer: Buffer; mimeType?: string; originalName?: string }> = []
    for (const item of body.images) {
      if (item.base64) {
        // Strip data:image/...;base64, prefix if present
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
      message: `Product "${result.product.title}" created successfully for vendor.`,
      ...result,
    })
  } catch (err: any) {
    console.error("[POST /admin/products/bulk-ai-upload] Error:", err)
    return res.status(500).json({
      error: err.message || "Bulk AI product creation failed.",
    })
  }
}
