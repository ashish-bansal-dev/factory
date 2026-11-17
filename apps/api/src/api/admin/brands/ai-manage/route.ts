import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BrandAiService } from "../../../../services/brands/brand-ai-service"

/**
 * POST /admin/brands/ai-manage
 * Dedicated AI pipeline to create, delete, and list brands using AI or explicit commands.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      instruction?: string
      action?: "create" | "delete" | "list"
      name?: string
      id?: string
      description?: string
      seller_id?: string
    }

    const brandService = new BrandAiService(req.scope)

    // 1. Natural language instruction
    if (body.instruction && body.instruction.trim().length > 0) {
      const result = await brandService.processBrandCommand(body.instruction, body.seller_id)
      return res.status(result.success ? 200 : 400).json(result)
    }

    // 2. Explicit action
    const action = body.action?.toLowerCase()
    if (action === "create") {
      if (!body.name) {
        return res.status(400).json({ error: "Brand name is required for creation." })
      }
      const created = await brandService.createBrand({
        name: body.name,
        description: body.description,
        sellerId: body.seller_id,
      })
      return res.status(200).json({
        action: "CREATE",
        success: true,
        brand: created,
        message: `Successfully created brand "${created.name}".`,
      })
    }

    if (action === "delete") {
      const target = body.id || body.name
      if (!target) {
        return res.status(400).json({ error: "Brand id or name is required for deletion." })
      }
      const deleted = await brandService.deleteBrand(target)
      return res.status(200).json({
        action: "DELETE",
        success: true,
        brand: deleted,
        message: `Successfully deleted brand "${deleted.name}".`,
      })
    }

    if (action === "list" || !action) {
      const brands = await brandService.listBrands()
      return res.status(200).json({
        action: "LIST",
        success: true,
        brands,
        count: brands.length,
      })
    }

    return res.status(400).json({
      error: "Invalid request. Provide an 'instruction' string or specify action: 'create' | 'delete' | 'list'.",
    })
  } catch (err: any) {
    console.error("[AdminBrandAi] Error in brand AI management route:", err)
    return res.status(500).json({
      error: err.message || "An error occurred during brand management.",
    })
  }
}
