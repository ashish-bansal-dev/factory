import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

export interface WhatsAppAiConfig {
  whatsapp_phone_number_id?: string
  whatsapp_access_token?: string
  whatsapp_verify_token?: string
  admin_whatsapp_phone?: string
  gemini_api_key?: string
  gemini_model?: string
  text_model?: string
  storefront_url?: string
  vendor_url?: string
}

export class WhatsAppConfigService {
  private container: MedusaContainer

  constructor(container: MedusaContainer) {
    this.container = container
  }

  /**
   * Fetches the WhatsApp & AI configuration stored in the database (store.metadata.whatsapp_ai_config),
   * falling back to environment variables when database fields are not set.
   */
  async getConfig(): Promise<WhatsAppAiConfig> {
    try {
      const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: stores } = await query.graph({
        entity: "store",
        fields: ["id", "metadata"],
      })
      const store = stores?.[0]
      const dbConfig =
        ((store?.metadata as Record<string, unknown> | undefined)
          ?.whatsapp_ai_config as Partial<WhatsAppAiConfig>) || {}

      return {
        whatsapp_phone_number_id:
          dbConfig.whatsapp_phone_number_id ||
          process.env.WHATSAPP_PHONE_NUMBER_ID ||
          "",
        whatsapp_access_token:
          dbConfig.whatsapp_access_token ||
          process.env.WHATSAPP_ACCESS_TOKEN ||
          "",
        whatsapp_verify_token:
          dbConfig.whatsapp_verify_token ||
          process.env.WHATSAPP_VERIFY_TOKEN ||
          "",
        admin_whatsapp_phone:
          dbConfig.admin_whatsapp_phone ||
          (process.env.ADMIN_WHATSAPP_PHONE || "").replace(/[^0-9]/g, "") ||
          "",
        gemini_api_key:
          dbConfig.gemini_api_key || process.env.GEMINI_API_KEY || "",
        gemini_model:
          dbConfig.gemini_model ||
          process.env.GEMINI_MODEL ||
          "gemini-3.5-flash-lite",
        text_model:
          dbConfig.text_model ||
          process.env.TEXT_MODEL ||
          "gemma-4-31b-it",
        storefront_url:
          dbConfig.storefront_url ||
          process.env.STOREFRONT_URL ||
          "http://localhost:3000",
        vendor_url:
          dbConfig.vendor_url ||
          process.env.VENDOR_URL ||
          "http://localhost:7001",
      }
    } catch (err: any) {
      console.warn(
        `[WhatsAppConfigService] Failed to load config from database: ${err.message}. Using env fallback.`
      )
      return {
        whatsapp_phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        whatsapp_access_token: process.env.WHATSAPP_ACCESS_TOKEN || "",
        whatsapp_verify_token: process.env.WHATSAPP_VERIFY_TOKEN || "",
        admin_whatsapp_phone:
          (process.env.ADMIN_WHATSAPP_PHONE || "").replace(/[^0-9]/g, "") || "",
        gemini_api_key: process.env.GEMINI_API_KEY || "",
        gemini_model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        text_model: process.env.TEXT_MODEL || "gemma-4-31b-it",
        storefront_url: process.env.STOREFRONT_URL || "http://localhost:3000",
        vendor_url: process.env.VENDOR_URL || "http://localhost:7001",
      }
    }
  }

  /**
   * Persists updated configuration into the database (store.metadata.whatsapp_ai_config).
   */
  async updateConfig(
    newConfig: Partial<WhatsAppAiConfig>
  ): Promise<WhatsAppAiConfig> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: stores } = await query.graph({
      entity: "store",
      fields: ["id", "metadata"],
    })
    const store = stores?.[0]
    if (!store) {
      throw new Error("Store record not found in database")
    }

    const existingMetadata =
      ((store.metadata as Record<string, unknown> | undefined) || {})
    const existingDbConfig =
      (existingMetadata.whatsapp_ai_config as Partial<WhatsAppAiConfig>) || {}

    const rawPhoneDigits = newConfig.admin_whatsapp_phone !== undefined
      ? newConfig.admin_whatsapp_phone.replace(/[^0-9]/g, "")
      : existingDbConfig.admin_whatsapp_phone
    const sanitizedAdminPhone = rawPhoneDigits && rawPhoneDigits.length >= 10
      ? rawPhoneDigits.slice(-10)
      : rawPhoneDigits

    const mergedConfig: WhatsAppAiConfig = {
      ...existingDbConfig,
      ...newConfig,
      ...(sanitizedAdminPhone !== undefined
        ? { admin_whatsapp_phone: sanitizedAdminPhone }
        : {}),
    }

    await updateStoresWorkflow(this.container).run({
      input: {
        selector: { id: store.id },
        update: {
          metadata: {
            ...existingMetadata,
            whatsapp_ai_config: mergedConfig,
          },
        },
      },
    })

    console.log("[WhatsAppConfigService] Successfully updated database configuration for store:", store.id)
    return this.getConfig()
  }
}
