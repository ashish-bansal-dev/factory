import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createBrandWorkflow, deleteBrandWorkflow } from "@mercurjs/core/workflows"
import { BrandStatus } from "@mercurjs/types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export interface BrandAiResult {
  action: "CREATE" | "DELETE" | "LIST" | "UNKNOWN"
  success: boolean
  brand?: {
    id: string
    name: string
    handle?: string
  }
  brands?: Array<{
    id: string
    name: string
    handle?: string
    status?: string
  }>
  message: string
}

export class BrandAiService {
  private container: MedusaContainer
  private apiKey?: string
  private model: string

  constructor(container: MedusaContainer, apiKey?: string, model?: string) {
    this.container = container
    this.apiKey = apiKey || process.env.GEMINI_API_KEY
    this.model = model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
  }

  async listBrands(): Promise<Array<{ id: string; name: string; handle: string; status?: string }>> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: brands } = await query.graph({
        entity: "brand",
        fields: ["id", "name", "handle", "status"],
        pagination: { skip: 0, take: 200 },
      })
      return brands || []
    } catch (err: any) {
      console.error("[BrandAiService] Error listing brands:", err.message)
      return []
    }
  }

  async createBrand(input: {
    name: string
    description?: string
    sellerId?: string
  }): Promise<{ id: string; name: string; handle: string }> {
    const cleanName = input.name.trim()
    if (!cleanName) {
      throw new Error("Brand name is required")
    }

    const handle = slugify(cleanName) || `brand-${Date.now()}`

    // Check if brand already exists
    const existing = await this.listBrands()
    const duplicate = existing.find(
      (b) => b.name.toLowerCase() === cleanName.toLowerCase() || b.handle === handle
    )
    if (duplicate) {
      throw new Error(`Brand "${cleanName}" already exists (ID: ${duplicate.id}).`)
    }

    const { result } = await createBrandWorkflow(this.container).run({
      input: {
        name: cleanName,
        handle,
        description: input.description || `Official ${cleanName} collection`,
        status: BrandStatus.APPROVED,
        seller_ids: input.sellerId ? [input.sellerId] : [],
      },
    })

    return {
      id: result.id,
      name: cleanName,
      handle,
    }
  }

  async deleteBrand(identifier: string): Promise<{ id: string; name: string }> {
    const clean = identifier.trim()
    if (!clean) {
      throw new Error("Brand name or ID is required for deletion.")
    }

    const brands = await this.listBrands()
    const match = brands.find(
      (b) =>
        b.id === clean ||
        b.name.toLowerCase() === clean.toLowerCase() ||
        b.handle.toLowerCase() === clean.toLowerCase()
    )

    if (!match) {
      throw new Error(`Brand "${clean}" not found.`)
    }

    await deleteBrandWorkflow(this.container).run({
      input: { id: match.id },
    })

    return {
      id: match.id,
      name: match.name,
    }
  }

  /**
   * Processes a natural language instruction using Gemini or fast command matching
   * to create, delete, or list brands using AI.
   */
  async processBrandCommand(instruction: string, sellerId?: string): Promise<BrandAiResult> {
    const cleanInstruction = instruction.trim()
    const upper = cleanInstruction.toUpperCase()

    // 1. Direct fast command matching (0ms latency, 0 API cost)
    if (upper === "BRANDS" || upper === "LIST BRANDS") {
      const all = await this.listBrands()
      const formatted = all.length
        ? all.map((b, i) => `${i + 1}. *${b.name}* (ID: \`${b.id}\`)`).join("\n")
        : "No brands registered yet."
      return {
        action: "LIST",
        success: true,
        brands: all,
        message: `🏷️ *Registered Marketplace Brands* (${all.length} total):\n\n${formatted}`,
      }
    }

    const createMatch = cleanInstruction.match(/^(?:CREATE|ADD|NEW)\s+BRAND\s+([a-zA-Z0-9_\-\s]+)/i)
    if (createMatch) {
      const name = createMatch[1].trim()
      try {
        const created = await this.createBrand({ name, sellerId })
        return {
          action: "CREATE",
          success: true,
          brand: created,
          message: `✅ Created approved brand *${created.name}* (ID: \`${created.id}\`)!`,
        }
      } catch (err: any) {
        return {
          action: "CREATE",
          success: false,
          message: `❌ Failed to create brand: ${err.message}`,
        }
      }
    }

    const deleteMatch = cleanInstruction.match(/^(?:DELETE|REMOVE|DROP)\s+BRAND\s+([a-zA-Z0-9_\-\s]+)/i)
    if (deleteMatch) {
      const target = deleteMatch[1].trim()
      try {
        const deleted = await this.deleteBrand(target)
        return {
          action: "DELETE",
          success: true,
          brand: deleted,
          message: `🗑️ Deleted brand *${deleted.name}* (ID: \`${deleted.id}\`) from marketplace.`,
        }
      } catch (err: any) {
        return {
          action: "DELETE",
          success: false,
          message: `❌ Failed to delete brand: ${err.message}`,
        }
      }
    }

    // 2. Multimodal AI Intent Parsing with Gemini
    try {
      const apiKey = this.apiKey || process.env.GEMINI_API_KEY
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.")
      }

      const { GoogleGenAI } = await import("@google/genai")
      const ai = new GoogleGenAI({ apiKey })

      const prompt = `You are an expert marketplace brand merchandising assistant.
Analyze the user's natural language instruction and determine whether they want to CREATE, DELETE, or LIST a brand.
User instruction: "${cleanInstruction}"

Extract a strict JSON response:
{
  "action": "CREATE" | "DELETE" | "LIST" | "UNKNOWN",
  "brand_name": string or null,
  "description": string or null
}`

      const response = await ai.models.generateContent({
        model: this.model,
        contents: [{ text: prompt }],
        config: { responseMimeType: "application/json" },
      })

      const parsed = JSON.parse(response.text || "{}")
      if (parsed.action === "CREATE" && parsed.brand_name) {
        const created = await this.createBrand({
          name: parsed.brand_name,
          description: parsed.description || undefined,
          sellerId,
        })
        return {
          action: "CREATE",
          success: true,
          brand: created,
          message: `✅ Created approved brand *${created.name}* (ID: \`${created.id}\`)!`,
        }
      } else if (parsed.action === "DELETE" && parsed.brand_name) {
        const deleted = await this.deleteBrand(parsed.brand_name)
        return {
          action: "DELETE",
          success: true,
          brand: deleted,
          message: `🗑️ Deleted brand *${deleted.name}* (ID: \`${deleted.id}\`).`,
        }
      } else if (parsed.action === "LIST") {
        const all = await this.listBrands()
        const formatted = all.map((b, i) => `${i + 1}. *${b.name}*`).join("\n")
        return {
          action: "LIST",
          success: true,
          brands: all,
          message: `🏷️ *Marketplace Brands*:\n\n${formatted}`,
        }
      }
    } catch (aiErr: any) {
      console.warn("[BrandAiService] AI parsing fallback:", aiErr.message)
    }

    return {
      action: "UNKNOWN",
      success: false,
      message: `❓ Could not recognize brand action. Commands:\n• *CREATE BRAND <name>*\n• *DELETE BRAND <name>*\n• *LIST BRANDS*`,
    }
  }
}
