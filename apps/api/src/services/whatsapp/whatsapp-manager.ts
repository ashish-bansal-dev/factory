import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { GeminiVisionService } from "./gemini-vision"
import { WhatsAppClient } from "./whatsapp-client"
import {
  AdminVendorContext,
  ExtractedProduct,
  ProductDraft,
  WhatsAppSession,
  WhatsAppWebhookBody,
} from "./types"

// In-memory cache for active sessions and admin vendor context
const activeSessions = new Map<string, WhatsAppSession>()
const adminVendorContexts = new Map<string, AdminVendorContext>()
const catalogPagination = new Map<string, { offset: number; sellerId?: string }>()

export class WhatsAppManager {
  private container: MedusaContainer
  private client: WhatsAppClient
  private vision: GeminiVisionService
  private adminPhone: string
  private storefrontUrl: string
  private vendorUrl: string

  constructor(container: MedusaContainer) {
    this.container = container
    this.client = new WhatsAppClient()
    this.vision = new GeminiVisionService()
    this.adminPhone = (process.env.ADMIN_WHATSAPP_PHONE || "").replace(/[^0-9]/g, "")
    this.storefrontUrl = (process.env.STOREFRONT_URL || "http://localhost:3000").replace(/\/+$/, "")
    this.vendorUrl = (process.env.VENDOR_URL || "http://localhost:7001").replace(/\/+$/, "")
  }

  private getAdminPhone(): string {
    return (process.env.ADMIN_WHATSAPP_PHONE || "").replace(/[^0-9]/g, "")
  }

  /**
   * Main webhook event processor.
   */
  async handleWebhookPayload(payload: WhatsAppWebhookBody): Promise<void> {
    if (!payload.entry?.length) {
      console.log("[WhatsAppManager] Received webhook payload with no entries.")
      return
    }

    for (const entry of payload.entry) {
      if (!entry.changes?.length) continue
      for (const change of entry.changes) {
        const value = change.value
        const messages = value?.messages

        // Handle delivery status updates vs incoming user messages
        if (!messages?.length) {
          if ((value as any)?.statuses) {
            console.log(`[WhatsAppManager] Received message status update: ${(value as any).statuses[0]?.status}`)
          }
          continue
        }

        for (const msg of messages) {
          console.log(`[WhatsAppManager] Inbound message from ${msg.from} (type: ${msg.type})`)
          try {
            await this.processMessage(msg)
          } catch (err: any) {
            console.error(`[WhatsAppManager] Error processing message ${msg.id}:`, err)
            await this.client.sendMessage(
              msg.from,
              `⚠️ An error occurred processing your request: ${err.message || "Unknown error"}`
            )
          }
        }
      }
    }
  }

  private async processMessage(msg: {
    from: string
    id: string
    type: string
    text?: { body: string }
    image?: { id: string; mime_type?: string; caption?: string }
  }): Promise<void> {
    const rawPhone = msg.from
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "")

    // 1. Authenticate sender
    const auth = await this.authenticateSender(cleanPhone)
    if (!auth) {
      await this.client.sendMessage(
        rawPhone,
        `❌ Your WhatsApp number (*+${cleanPhone}*) is not registered with any seller or admin account.\n\nPlease link your phone number in the Vendor Settings dashboard or contact support.`
      )
      return
    }

    const { isAdmin, sellerId, sellerName } = auth

    // 2. Handle Text Messages
    if (msg.type === "text" && msg.text?.body) {
      const text = msg.text.body.trim()
      await this.handleTextMessage(rawPhone, cleanPhone, text, isAdmin, sellerId, sellerName)
      return
    }

    // 3. Handle Image Messages
    if (msg.type === "image" && msg.image?.id) {
      await this.handleImageMessage(
        rawPhone,
        cleanPhone,
        msg.image.id,
        msg.image.mime_type || "image/jpeg",
        msg.image.caption,
        isAdmin,
        sellerId,
        sellerName
      )
      return
    }
  }

  /**
   * Authenticate phone number against seller table or ADMIN_WHATSAPP_PHONE.
   */
  private async authenticateSender(cleanPhone: string): Promise<{
    isAdmin: boolean
    sellerId?: string
    sellerName?: string
  } | null> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const adminPhone = this.getAdminPhone()

    console.log(`[WhatsAppManager] Authenticating ${cleanPhone} against Admin (${adminPhone})`)

    // Check Admin
    if (adminPhone && (cleanPhone.endsWith(adminPhone) || adminPhone.endsWith(cleanPhone))) {
      const adminCtx = adminVendorContexts.get(cleanPhone)
      return {
        isAdmin: true,
        sellerId: adminCtx?.sellerId,
        sellerName: adminCtx?.sellerName || "Marketplace Admin",
      }
    }

    // Query seller table for matching phone
    try {
      const phoneVariants = [cleanPhone, `+${cleanPhone}`]
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "phone"],
        filters: {
          phone: phoneVariants,
        },
      })

      if (sellers && sellers.length > 0) {
        const seller = sellers[0]
        return {
          isAdmin: false,
          sellerId: seller.id,
          sellerName: seller.name,
        }
      }
    } catch (e: any) {
      console.error("[WhatsAppManager] Seller query error:", e)
    }

    return null
  }

  /**
   * Text message handler for commands, state updates, and queries.
   */
  private async handleTextMessage(
    toPhone: string,
    cleanPhone: string,
    rawText: string,
    isAdmin: boolean,
    currentSellerId?: string,
    currentSellerName?: string
  ): Promise<void> {
    const textUpper = rawText.toUpperCase()

    // Command: HELP
    if (textUpper === "HELP" || textUpper === "MENU") {
      await this.sendHelpMessage(toPhone, isAdmin)
      return
    }

    // Command: VENDOR <name> / SWITCH VENDOR <name> (Admin only)
    if (isAdmin && (textUpper.startsWith("VENDOR ") || textUpper.startsWith("SWITCH VENDOR "))) {
      const vendorQuery = rawText.replace(/^(SWITCH\s+)?VENDOR\s+/i, "").trim()
      await this.handleAdminSwitchVendor(toPhone, cleanPhone, vendorQuery)
      return
    }

    // Command: CLEAR VENDOR / EXIT (Admin only)
    if (isAdmin && (textUpper === "CLEAR VENDOR" || textUpper === "EXIT VENDOR" || textUpper === "EXIT")) {
      adminVendorContexts.delete(cleanPhone)
      await this.client.sendMessage(
        toPhone,
        `ℹ️ Active vendor context cleared. You are now operating as *Marketplace Admin*.`
      )
      return
    }

    // Command: LIST PRODUCTS / LIST PRODUCT / NEXT / PRODUCT <N>
    if (
      textUpper === "LIST PRODUCTS" ||
      textUpper === "LIST PRODUCT" ||
      textUpper === "PRODUCTS" ||
      textUpper === "PRODUCT" ||
      textUpper === "NEXT" ||
      /^PRODUCT\s+\d+$/i.test(rawText)
    ) {
      await this.handleCatalogQuery(toPhone, cleanPhone, rawText, currentSellerId, currentSellerName)
      return
    }

    // Check ongoing Draft session
    const session = activeSessions.get(cleanPhone)
    if (!session || !session.draft) {
      // Check if user replied "DONE" while images are being buffered
      if (session && session.step === "COLLECTING_IMAGES" && textUpper === "DONE") {
        if (session.debounceTimer) clearTimeout(session.debounceTimer)
        await this.finalizeImageCollection(cleanPhone, toPhone)
        return
      }

      await this.client.sendMessage(
        toPhone,
        `👋 Welcome! Send 1 or more product photos with an optional caption to create a product draft, or type *LIST PRODUCTS* to inspect inventory. Type *HELP* for all commands.`
      )
      return
    }

    // Draft Actions: CANCEL
    if (textUpper === "CANCEL" || textUpper === "DISCARD") {
      activeSessions.delete(cleanPhone)
      await this.client.sendMessage(toPhone, `🗑️ Product draft has been cancelled and discarded.`)
      return
    }

    // Draft Actions: PRICE <amount>
    if (textUpper.startsWith("PRICE ") || /^\$?\d+(\.\d+)?$/.test(rawText)) {
      const priceStr = rawText.replace(/[^0-9.]/g, "")
      const newPrice = parseFloat(priceStr)
      if (isNaN(newPrice) || newPrice <= 0) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a valid price, e.g. *PRICE 49.99*`)
        return
      }

      session.draft.product.suggested_price = newPrice
      if (session.draft.product.variants?.length) {
        for (const v of session.draft.product.variants) {
          v.price = newPrice
        }
      }
      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated price to *$${newPrice.toFixed(2)}*!`)
      return
    }

    // Draft Actions: TITLE <text>
    if (textUpper.startsWith("TITLE ")) {
      const newTitle = rawText.replace(/^TITLE\s+/i, "").trim()
      if (!newTitle) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a title, e.g. *TITLE Cotton Casual Shirt*`)
        return
      }

      session.draft.product.title = newTitle
      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated title to *${newTitle}*!`)
      return
    }

    // Draft Actions: YES / CONFIRM
    if (textUpper === "YES" || textUpper === "CONFIRM" || textUpper === "PUBLISH") {
      if (
        session.draft.product.suggested_price == null ||
        isNaN(session.draft.product.suggested_price) ||
        session.draft.product.suggested_price <= 0
      ) {
        await this.client.sendMessage(
          toPhone,
          `⚠️ A valid price is required before publishing. Please reply with: *PRICE <amount>* (e.g. *PRICE 35*)`
        )
        return
      }

      await this.publishDraft(toPhone, cleanPhone, session.draft)
      activeSessions.delete(cleanPhone)
      return
    }

    // Unrecognized text during draft confirmation
    await this.client.sendMessage(
      toPhone,
      `❓ Unrecognized command. Reply:\n- *YES* to publish\n- *PRICE <amount>* to change price\n- *TITLE <text>* to change title\n- *CANCEL* to discard`
    )
  }

  /**
   * Switches the active vendor context for an Admin.
   */
  private async handleAdminSwitchVendor(
    toPhone: string,
    cleanPhone: string,
    vendorQuery: string
  ): Promise<void> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    try {
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "handle"],
        filters: {
          $or: [
            { id: vendorQuery },
            { name: { $ilike: `%${vendorQuery}%` } },
            { handle: { $ilike: `%${vendorQuery}%` } },
          ],
        },
      })

      if (!sellers || sellers.length === 0) {
        await this.client.sendMessage(
          toPhone,
          `❌ No vendor found matching "*${vendorQuery}*". Please check the vendor name or ID.`
        )
        return
      }

      const selected = sellers[0]
      adminVendorContexts.set(cleanPhone, {
        sellerId: selected.id,
        sellerName: selected.name,
        updatedAt: Date.now(),
      })

      await this.client.sendMessage(
        toPhone,
        `✅ Active vendor context set to: *${selected.name}* (ID: \`${selected.id}\`).\n\nAll subsequent product uploads and *LIST PRODUCTS* commands will now apply to this vendor.\n\nReply *CLEAR VENDOR* to return to general admin.`
      )
    } catch (e: any) {
      await this.client.sendMessage(toPhone, `⚠️ Error searching for vendor: ${e.message}`)
    }
  }

  /**
   * Handles "LIST PRODUCTS", "NEXT", and "PRODUCT <index>" commands.
   */
  private async handleCatalogQuery(
    toPhone: string,
    cleanPhone: string,
    rawText: string,
    currentSellerId?: string,
    currentSellerName?: string
  ): Promise<void> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const textUpper = rawText.toUpperCase()

    // Handle "PRODUCT <index>"
    const productMatch = rawText.match(/^PRODUCT\s+(\d+)$/i)
    if (productMatch) {
      const targetIndex = parseInt(productMatch[1], 10)
      const pagination = catalogPagination.get(cleanPhone)
      const currentOffset = pagination?.offset ?? 0
      const queryOffset = Math.max(0, currentOffset - 5)

      const filters: any = {}
      if (currentSellerId) {
        filters["seller_id"] = currentSellerId
      }

      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "description", "status", "variants.*"],
        filters,
        pagination: { skip: queryOffset, take: 5 },
      })

      if (!products || !products[targetIndex - 1]) {
        await this.client.sendMessage(toPhone, `⚠️ Product #${targetIndex} not found in current page.`)
        return
      }

      const p = products[targetIndex - 1]
      const firstVariantPrices = (p.variants?.[0] as any)?.prices
      const price = firstVariantPrices?.[0]?.amount
        ? `$${(firstVariantPrices[0].amount / 100).toFixed(2)}`
        : "N/A"

      const storefrontLink = `${this.storefrontUrl}/products/${p.handle}`
      const dashboardLink = currentSellerId
        ? `${this.vendorUrl}/products/${p.id}`
        : `${this.storefrontUrl}/admin/products/${p.id}`

      await this.client.sendMessage(
        toPhone,
        `📦 *${p.title}*\n• *Status*: ${p.status}\n• *Price*: ${price}\n• *Variants*: ${p.variants?.length || 1}\n\n📝 *Description*:\n${p.description || "No description."}\n\n🌐 *Storefront*: ${storefrontLink}\n🛠️ *Dashboard Edit*: ${dashboardLink}`
      )
      return
    }

    // Determine pagination offset
    let offset = 0
    if (textUpper === "NEXT") {
      const existing = catalogPagination.get(cleanPhone)
      offset = (existing?.offset ?? 0) + 5
    }

    const filters: any = {}
    if (currentSellerId) {
      filters["seller_id"] = currentSellerId
    }

    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "status",
        "variants.id",
        "variants.title",
        "variants.prices.*",
        "variants.inventory_quantity",
      ],
      filters,
      pagination: { skip: offset, take: 5 },
    })

    const totalCount = metadata?.count ?? products.length

    if (!products || products.length === 0) {
      await this.client.sendMessage(
        toPhone,
        offset > 0
          ? `🏁 Reached end of catalog for *${currentSellerName || "store"}*.`
          : `📭 No products found for *${currentSellerName || "store"}*.`
      )
      catalogPagination.delete(cleanPhone)
      return
    }

    catalogPagination.set(cleanPhone, { offset, sellerId: currentSellerId })

    const lines: string[] = []
    lines.push(`📋 *Products for ${currentSellerName || "Marketplace"}* (Showing ${offset + 1}-${offset + products.length} of ${totalCount}):\n`)

    products.forEach((p, idx) => {
      const firstVariantPrices = (p.variants?.[0] as any)?.prices
      const firstPrice = firstVariantPrices?.[0]?.amount
      const priceStr = firstPrice ? `$${(firstPrice / 100).toFixed(2)}` : "No price"
      lines.push(`${idx + 1}. *${p.title}* - ${priceStr} (${p.status})`)
    })

    lines.push(`\n👉 Reply:\n- *PRODUCT <1-5>* to view details and links`)
    if (offset + products.length < totalCount) {
      lines.push(`- *NEXT* to view the next 5 products`)
    }

    await this.client.sendMessage(toPhone, lines.join("\n"))
  }

  /**
   * Handles incoming photo uploads with 30-second album debounce.
   */
  private async handleImageMessage(
    toPhone: string,
    cleanPhone: string,
    mediaId: string,
    mimeType: string,
    caption?: string,
    isAdmin?: boolean,
    sellerId?: string,
    sellerName?: string
  ): Promise<void> {
    let session = activeSessions.get(cleanPhone)

    if (!session) {
      session = {
        step: "COLLECTING_IMAGES",
        phone: cleanPhone,
        pendingImages: [],
        lastUpdated: Date.now(),
      }
      activeSessions.set(cleanPhone, session)
    }

    // Reset step if previous was already finalized
    if (session.step === "AWAITING_CONFIRMATION" || session.step === "AWAITING_PRICE") {
      session.step = "COLLECTING_IMAGES"
      session.pendingImages = []
      session.draft = undefined
    }

    // Buffer image
    session.pendingImages.push({ mediaId, mimeType })
    session.lastUpdated = Date.now()

    // Store caption on session if provided
    if (caption) {
      (session as any).caption = caption
    }

    // Clear previous debounce timer if active
    if (session.debounceTimer) {
      clearTimeout(session.debounceTimer)
    }

    // Acknowledge receipt if first image
    if (session.pendingImages.length === 1) {
      await this.client.sendMessage(
        toPhone,
        `📸 Received image! Send additional photos if needed, or wait 30 seconds for AI processing (or reply *DONE* to process immediately).`
      )
    }

    // Set 30-second debounce timer
    session.debounceTimer = setTimeout(async () => {
      try {
        await this.finalizeImageCollection(cleanPhone, toPhone, isAdmin, sellerId, sellerName)
      } catch (err: any) {
        console.error("[WhatsAppManager] Debounce processing failed:", err)
        await this.client.sendMessage(toPhone, `⚠️ Failed to process product images: ${err.message}`)
      }
    }, 30000)
  }

  /**
   * Downloads buffered images, uploads to Medusa File Service, runs Gemini Vision, and sends preview.
   */
  private async finalizeImageCollection(
    cleanPhone: string,
    toPhone: string,
    isAdmin?: boolean,
    sellerId?: string,
    sellerName?: string
  ): Promise<void> {
    const session = activeSessions.get(cleanPhone)
    if (!session || !session.pendingImages.length) return

    await this.client.sendMessage(
      toPhone,
      `⏳ Analyzing ${session.pendingImages.length} image(s) with Google Gemini Vision... Please wait a few seconds.`
    )

    // 1. Download images from WhatsApp Graph API
    const downloadedImages: Array<{ buffer: Buffer; mimeType: string }> = []
    for (const item of session.pendingImages) {
      try {
        const fileData = await this.client.downloadMedia(item.mediaId)
        downloadedImages.push(fileData)
      } catch (dlErr: any) {
        console.error(`[WhatsAppManager] Failed to download media ${item.mediaId}:`, dlErr)
      }
    }

    if (!downloadedImages.length) {
      await this.client.sendMessage(
        toPhone,
        `⚠️ Failed to download the attached image(s) from WhatsApp. Please try sending the photo again.`
      )
      session.pendingImages = []
      activeSessions.set(cleanPhone, session)
      return
    }

    // 2. Upload images to Medusa File Service (S3/R2/Local)
    let imageUrls: string[] = []
    try {
      const targetSellerId = sellerId || "marketplace_admin"
      const uploadInput = downloadedImages.map((img, idx) => ({
        filename: `whatsapp/${targetSellerId}/${Date.now()}_img_${idx + 1}.jpg`,
        mimeType: img.mimeType,
        content: img.buffer.toString("base64"),
        access: "public" as const,
      }))

      const { result: uploadedFiles } = await uploadFilesWorkflow(this.container).run({
        input: { files: uploadInput },
      })

      imageUrls = (uploadedFiles as Array<{ url: string }>).map((f) => f.url)
    } catch (uploadErr: any) {
      console.warn("[WhatsAppManager] File upload workflow warning (using fallback):", uploadErr.message)
      imageUrls = downloadedImages.map((_, idx) => `http://localhost:9000/static/whatsapp_img_${Date.now()}_${idx + 1}.jpg`)
    }

    // 3. Multimodal Analysis with Gemini 3.1 Flash Lite
    let extracted: ExtractedProduct
    try {
      const caption = (session as any).caption as string | undefined
      extracted = await this.vision.extractProductDetails(downloadedImages, caption)
      console.log(`[WhatsAppManager] Successfully extracted: "${extracted.title}"`)
    } catch (aiErr: any) {
      console.error("[WhatsAppManager] Gemini extraction failed:", aiErr)
      await this.client.sendMessage(
        toPhone,
        `⚠️ AI analysis failed: ${aiErr.message || "Unknown error"}. Please try again.`
      )
      session.pendingImages = []
      activeSessions.set(cleanPhone, session)
      return
    }

    // 4. Save Draft
    const draft: ProductDraft = {
      product: extracted,
      imageUrls,
      createdAt: Date.now(),
      targetSellerId: sellerId || "",
      targetSellerName: sellerName,
      isAdmin: Boolean(isAdmin),
    }

    session.draft = draft
    session.step = extracted.suggested_price == null ? "AWAITING_PRICE" : "AWAITING_CONFIRMATION"
    session.pendingImages = []
    if (session.debounceTimer) clearTimeout(session.debounceTimer)

    activeSessions.set(cleanPhone, session)

    // 5. Send Preview
    await this.sendDraftPreview(toPhone, draft)
  }

  /**
   * Formats and sends the product preview message to WhatsApp.
   */
  private async sendDraftPreview(
    toPhone: string,
    draft: ProductDraft,
    prefixMessage?: string
  ): Promise<void> {
    const p = draft.product
    const priceDisplay =
      p.suggested_price != null ? `$${p.suggested_price.toFixed(2)}` : "⚠️ *NOT SET*"

    const variantsText =
      p.variants?.map((v) => v.title).join(", ") || "Default"

    const messageLines = [
      prefixMessage ? `${prefixMessage}\n` : "",
      `📦 *Product Preview*`,
      `• *Title*: ${p.title}`,
      p.subtitle ? `• *Subtitle*: ${p.subtitle}` : "",
      `• *Category*: ${p.category_name || "General"}`,
      p.material ? `• *Material*: ${p.material}` : "",
      `• *Price*: ${priceDisplay}`,
      `• *Variants*: ${variantsText}`,
      `• *Images*: ${draft.imageUrls.length} attached`,
      draft.targetSellerName ? `• *Vendor*: ${draft.targetSellerName}` : "",
      "",
      `📝 *Description*:\n${p.description.slice(0, 300)}${p.description.length > 300 ? "..." : ""}`,
      "",
    ].filter(Boolean)

    if (p.suggested_price == null) {
      messageLines.push(`👉 *Please reply with the price to continue* (e.g. *PRICE 49.99*):`)
    } else {
      messageLines.push(`👉 Reply:`)
      messageLines.push(`- *YES* to publish to store`)
      messageLines.push(`- *PRICE <amount>* to change price (e.g. PRICE 50)`)
      messageLines.push(`- *TITLE <text>* to change title`)
      messageLines.push(`- *CANCEL* to discard`)
    }

    await this.client.sendMessage(toPhone, messageLines.join("\n"))
  }

  /**
   * Publishes the confirmed product using Mercur's createProductsWorkflow.
   */
  private async publishDraft(
    toPhone: string,
    cleanPhone: string,
    draft: ProductDraft
  ): Promise<void> {
    const p = draft.product
    const priceAmount = Math.round((p.suggested_price || 0) * 100)

    const variants =
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            title: v.title || "Default",
            sku: v.sku,
            prices: [
              {
                currency_code: p.currency_code || "usd",
                amount: Math.round((v.price || p.suggested_price || 0) * 100),
              },
            ],
          }))
        : [
            {
              title: "Default",
              prices: [
                {
                  currency_code: p.currency_code || "usd",
                  amount: priceAmount,
                },
              ],
            },
          ]

    const productPayload: any = {
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      status: ProductStatus.PUBLISHED,
      images: draft.imageUrls.map((url) => ({ url })),
      thumbnail: draft.imageUrls[0],
      variants,
      metadata: {
        listing_scope: "store_only",
        created_via: "whatsapp",
        material: p.material,
      },
    }

    if (draft.targetSellerId) {
      productPayload.seller_ids = [draft.targetSellerId]
    }

    // Run createProductsWorkflow
    const { result } = await createProductsWorkflow(this.container).run({
      input: {
        products: [productPayload],
        created_by: draft.targetSellerId || "whatsapp_bot",
      },
    })

    const createdId = (result as { id: string }[])[0].id

    // Fetch created product for handle
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const {
      data: [createdProduct],
    } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle"],
      filters: { id: createdId },
    })

    const storefrontLink = `${this.storefrontUrl}/products/${createdProduct?.handle || createdId}`
    const dashboardLink = draft.targetSellerId
      ? `${this.vendorUrl}/products/${createdId}`
      : `${this.storefrontUrl}/admin/products/${createdId}`

    await this.client.sendMessage(
      toPhone,
      `🎉 *Product Published Successfully!*\n\n• *Title*: ${p.title}\n• *Price*: $${(p.suggested_price || 0).toFixed(2)}\n• *Seller*: ${draft.targetSellerName || "Marketplace"}\n\n🌐 *View Live on Store*: ${storefrontLink}\n🛠️ *Edit in Dashboard*: ${dashboardLink}`
    )
  }

  private async sendHelpMessage(toPhone: string, isAdmin: boolean): Promise<void> {
    const lines = [
      `🤖 *WhatsApp Product Assistant*`,
      `Commands:`,
      `• *Upload Product*: Send 1-4 photos with an optional caption.`,
      `• *LIST PRODUCTS*: Show recent store products.`,
      `• *PRODUCT <number>*: View details and edit link for a product.`,
    ]

    if (isAdmin) {
      lines.push(
        `\n👑 *Admin Commands*:`,
        `• *VENDOR <Name or ID>*: Switch active vendor to upload or query on their behalf.`,
        `• *CLEAR VENDOR*: Clear active vendor context.`
      )
    }

    lines.push(`\nDuring draft confirmation:`, `• *YES* | *PRICE <amount>* | *TITLE <text>* | *CANCEL*`)
    await this.client.sendMessage(toPhone, lines.join("\n"))
  }
}
