export interface WhatsAppClientConfig {
  phoneNumberId?: string
  accessToken?: string
  verifyToken?: string
  apiVersion?: string
}

export class WhatsAppClient {
  private phoneNumberId: string
  private accessToken: string
  private verifyToken: string
  private apiVersion: string

  constructor(config?: WhatsAppClientConfig) {
    this.phoneNumberId =
      config?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || ""
    this.accessToken =
      config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || ""
    this.verifyToken =
      config?.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || ""
    this.apiVersion = config?.apiVersion || "v21.0"
  }

  private getAccessToken(): string {
    return this.accessToken || process.env.WHATSAPP_ACCESS_TOKEN || ""
  }

  private getPhoneNumberId(): string {
    return this.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || ""
  }

  private getVerifyToken(): string {
    return this.verifyToken || process.env.WHATSAPP_VERIFY_TOKEN || ""
  }

  /**
   * Validates the verification handshake challenge from Meta.
   */
  verifyWebhook(query: Record<string, any>): string | null {
    const mode = query["hub.mode"]
    const token = query["hub.verify_token"]
    const challenge = query["hub.challenge"]

    if (mode === "subscribe" && token === this.getVerifyToken()) {
      return String(challenge)
    }

    return null
  }

  /**
   * Downloads media by mediaId from Meta Graph API.
   */
  async downloadMedia(
    mediaId: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const token = this.getAccessToken()
    if (!token) {
      throw new Error("WHATSAPP_ACCESS_TOKEN is not configured")
    }

    const metadataUrl = `https://graph.facebook.com/${this.apiVersion}/${mediaId}`
    const metaResponse = await fetch(metadataUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!metaResponse.ok) {
      const errText = await metaResponse.text()
      throw new Error(
        `Failed to fetch WhatsApp media metadata for ${mediaId}: ${errText}`
      )
    }

    const metaData = (await metaResponse.json()) as {
      url: string
      mime_type: string
    }

    const mediaResponse = await fetch(metaData.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!mediaResponse.ok) {
      throw new Error(
        `Failed to download WhatsApp media file from ${metaData.url}`
      )
    }

    const arrayBuffer = await mediaResponse.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType: metaData.mime_type || "image/jpeg",
    }
  }

  /**
   * Sends a plain or markdown text message to a WhatsApp number.
   */
  async sendMessage(to: string, message: string): Promise<boolean> {
    const token = this.getAccessToken()
    const phoneId = this.getPhoneNumberId()

    if (!token || !phoneId) {
      console.warn(
        `[WhatsAppClient] WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing. Message to ${to} suppressed:\n${message}`
      )
      return false
    }

    const cleanTo = to.replace(/[^0-9]/g, "")
    const url = `https://graph.facebook.com/${this.apiVersion}/${phoneId}/messages`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      }),
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error(
        `[WhatsAppClient] Failed to send WhatsApp message to ${cleanTo}:`,
        errorData
      )
      return false
    }

    return true
  }
}
