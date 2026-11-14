import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WhatsAppConfigService } from "../../../services/whatsapp/config-service"

/**
 * GET /admin/whatsapp-config
 * Retrieves WhatsApp & AI configuration stored in the database.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const configService = new WhatsAppConfigService(req.scope)
    const config = await configService.getConfig()
    return res.status(200).json({ config })
  } catch (err: any) {
    console.error("[GET /admin/whatsapp-config] Error:", err)
    return res.status(500).json({ error: err.message || "Failed to load configuration" })
  }
}

/**
 * POST /admin/whatsapp-config
 * Updates and saves WhatsApp & AI configuration into the database (store.metadata).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const configService = new WhatsAppConfigService(req.scope)
    const updated = await configService.updateConfig(req.body as any)
    return res.status(200).json({ config: updated, message: "Configuration saved successfully" })
  } catch (err: any) {
    console.error("[POST /admin/whatsapp-config] Error:", err)
    return res.status(500).json({ error: err.message || "Failed to save configuration" })
  }
}
