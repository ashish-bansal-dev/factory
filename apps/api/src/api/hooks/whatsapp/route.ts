import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WhatsAppClient } from "../../../services/whatsapp/whatsapp-client"
import { WhatsAppManager } from "../../../services/whatsapp/whatsapp-manager"
import { WhatsAppWebhookBody } from "../../../services/whatsapp/types"

/**
 * GET /hooks/whatsapp
 * Meta WhatsApp Cloud API Webhook verification challenge.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const client = new WhatsAppClient()
  const challenge = client.verifyWebhook(req.query)

  if (challenge) {
    return res.status(200).send(challenge)
  }

  return res.status(403).json({ error: "Verification token mismatch" })
}

/**
 * POST /hooks/whatsapp
 * Inbound webhook receiver for WhatsApp messages and media.
 */
export async function POST(
  req: MedusaRequest<WhatsAppWebhookBody>,
  res: MedusaResponse
) {
  console.log("[POST /hooks/whatsapp] Received webhook event from Meta:", JSON.stringify(req.body, null, 2))
  const manager = new WhatsAppManager(req.scope)

  // Respond 200 OK immediately to Meta to acknowledge receipt, and process payload
  res.status(200).json({ status: "received" })

  try {
    await manager.handleWebhookPayload(req.body)
  } catch (err: any) {
    console.error("[POST /hooks/whatsapp] Webhook handling error:", err)
  }
}
