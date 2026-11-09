import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { uploadFilesWorkflow, linkProductsToSalesChannelWorkflow } from "@medusajs/medusa/core-flows"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import { GeminiVisionService } from "./gemini-vision"
import { WhatsAppClient } from "./whatsapp-client"
import { ImageCompressor } from "./image-compressor"
import { DraftEditorService } from "./draft-editor"
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
  private compressor: ImageCompressor
  private draftEditor: DraftEditorService
  private adminPhone: string
  private storefrontUrl: string
  private vendorUrl: string

  constructor(container: MedusaContainer) {
    this.container = container
    this.client = new WhatsAppClient()
    this.vision = new GeminiVisionService()
    this.compressor = new ImageCompressor({
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 82,
      format: "webp",
    })
    this.draftEditor = new DraftEditorService()
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

    // Command: SELLERS / LIST SELLERS / VENDORS (Admin only)
    if (
      isAdmin &&
      (textUpper === "SELLERS" ||
        textUpper === "LIST SELLERS" ||
        textUpper === "VENDORS" ||
        textUpper === "LIST VENDORS")
    ) {
      await this.handleListSellers(toPhone)
      return
    }

    // Command: VENDOR <name> / SWITCH VENDOR <name> / SELLER <name> (Admin only)
    if (isAdmin && (textUpper.startsWith("VENDOR ") || textUpper.startsWith("SWITCH VENDOR ") || textUpper.startsWith("SELLER "))) {
      const vendorQuery = rawText.replace(/^(SWITCH\s+)?(VENDOR|SELLER)\s+/i, "").trim()
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

    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    let availableSellers: Array<{ id: string; name: string; handle: string }> = []
    if (isAdmin) {
      try {
        const { data: sellers } = await query.graph({
          entity: "seller",
          fields: ["id", "name", "handle"],
        })
        availableSellers = sellers || []
      } catch {}
    }

    // Check ongoing Draft session
    const session = activeSessions.get(cleanPhone)
    if (!session || !session.draft) {
      // Check if user replied "DONE" while images are being buffered
      if (session && session.step === "COLLECTING_IMAGES" && textUpper === "DONE") {
        if (session.debounceTimer) clearTimeout(session.debounceTimer)
        await this.finalizeImageCollection(
          cleanPhone,
          toPhone,
          isAdmin,
          (session as any).targetSellerId || currentSellerId,
          (session as any).targetSellerName || currentSellerName
        )
        return
      }

      // General conversation and handling with Gemma 4 31B
      try {
        const assistantRes = await this.draftEditor.processConversation(
          {
            isAdmin,
            sellerId: currentSellerId,
            sellerName: currentSellerName,
            availableSellers,
            hasDraft: false,
          },
          rawText
        )

        if (assistantRes.action === "LIST_PRODUCTS") {
          await this.handleCatalogQuery(toPhone, cleanPhone, rawText, currentSellerId, currentSellerName)
          return
        }

        if (assistantRes.action === "LIST_SELLERS" && isAdmin) {
          await this.handleListSellers(toPhone)
          return
        }

        if (assistantRes.action === "SWITCH_VENDOR" && isAdmin && assistantRes.sellerQuery) {
          await this.handleAdminSwitchVendor(toPhone, cleanPhone, assistantRes.sellerQuery)
          return
        }

        if (assistantRes.action === "CLEAR_VENDOR" && isAdmin) {
          adminVendorContexts.delete(cleanPhone)
          await this.client.sendMessage(
            toPhone,
            assistantRes.replyMessage || `ℹ️ Active vendor context cleared.`
          )
          return
        }

        if (assistantRes.action === "HELP") {
          await this.sendHelpMessage(toPhone, isAdmin)
          return
        }

        // Send friendly conversational response from Gemma 4
        await this.client.sendMessage(toPhone, assistantRes.replyMessage)
        return
      } catch (err: any) {
        console.warn("[WhatsAppManager] General conversation AI error:", err)
        await this.client.sendMessage(
          toPhone,
          `👋 Welcome! Send 1 or more product photos with an optional caption to create a product draft, or type *LIST PRODUCTS* to inspect inventory. Type *HELP* for all commands.`
        )
        return
      }
    }

    // Draft Actions: CANCEL
    if (textUpper === "CANCEL" || textUpper === "DISCARD") {
      activeSessions.delete(cleanPhone)
      await this.client.sendMessage(toPhone, `🗑️ Product draft has been cancelled and discarded.`)
      return
    }

    // Draft Actions: PRICE <amount>
    if (textUpper.startsWith("PRICE ") || /^[₹\$]?\d+(\.\d+)?$/.test(rawText)) {
      const priceStr = rawText.replace(/[^0-9.]/g, "")
      const newPrice = parseFloat(priceStr)
      if (isNaN(newPrice) || newPrice <= 0) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a valid price in INR, e.g. *PRICE 1499*`)
        return
      }

      session.draft.product.suggested_price = newPrice
      session.draft.product.currency_code = "inr"
      if (session.draft.product.variants?.length) {
        for (const v of session.draft.product.variants) {
          v.price = newPrice
        }
      }
      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated price to *₹${newPrice}*!`)
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
          `⚠️ A valid price is required before publishing. Please reply with: *PRICE <amount>* (e.g. *PRICE 999*)`
        )
        return
      }

      await this.publishDraft(toPhone, cleanPhone, session.draft)
      activeSessions.delete(cleanPhone)
      return
    }

    // Draft Actions: VENDOR <name> / SELLER <name> (Admin only)
    if (isAdmin && (textUpper.startsWith("VENDOR ") || textUpper.startsWith("SELLER ") || textUpper.startsWith("ASSIGN "))) {
      const vendorQuery = rawText.replace(/^(VENDOR|SELLER|ASSIGN(\s+TO)?)\s+/i, "").trim()
      await this.handleAdminSwitchVendor(toPhone, cleanPhone, vendorQuery)
      return
    }

    // Natural Language Draft Edits via Gemma 4 31B
    try {
      const assistantRes = await this.draftEditor.processConversation(
        {
          isAdmin,
          sellerId: session.draft.targetSellerId,
          sellerName: session.draft.targetSellerName,
          availableSellers,
          hasDraft: true,
          draftProduct: session.draft.product,
        },
        rawText
      )

      // Handle Admin Seller Assignment during Draft
      if (isAdmin && (assistantRes.action === "ASSIGN_SELLER" || assistantRes.action === "SWITCH_VENDOR")) {
        const queryToMatch = assistantRes.sellerQuery
        if (queryToMatch) {
          const matched = availableSellers.find(
            (s) =>
              s.id.toLowerCase() === queryToMatch.toLowerCase() ||
              s.handle?.toLowerCase() === queryToMatch.toLowerCase() ||
              s.name.toLowerCase().includes(queryToMatch.toLowerCase())
          )
          if (matched) {
            session.draft.targetSellerId = matched.id
            session.draft.targetSellerName = matched.name
            adminVendorContexts.set(cleanPhone, {
              sellerId: matched.id,
              sellerName: matched.name,
              updatedAt: Date.now(),
            })
          }
        }
        if (assistantRes.updatedProduct) {
          session.draft.product = assistantRes.updatedProduct
        }
        activeSessions.set(cleanPhone, session)
        await this.sendDraftPreview(toPhone, session.draft, `✅ ${assistantRes.replyMessage}`)
        return
      }

      if (assistantRes.action === "PUBLISH_DRAFT") {
        if (
          assistantRes.updatedProduct?.suggested_price != null &&
          assistantRes.updatedProduct.suggested_price > 0
        ) {
          session.draft.product = assistantRes.updatedProduct
        }

        if (
          session.draft.product.suggested_price == null ||
          isNaN(session.draft.product.suggested_price) ||
          session.draft.product.suggested_price <= 0
        ) {
          await this.client.sendMessage(
            toPhone,
            `⚠️ A valid price is required before publishing. Please reply with: *PRICE <amount>* (e.g. *PRICE 999*)`
          )
          return
        }

        await this.publishDraft(toPhone, cleanPhone, session.draft)
        activeSessions.delete(cleanPhone)
        return
      }

      if (assistantRes.action === "CANCEL_DRAFT") {
        activeSessions.delete(cleanPhone)
        await this.client.sendMessage(
          toPhone,
          `🗑️ ${assistantRes.replyMessage || "Product draft has been cancelled and discarded."}`
        )
        return
      }

      if (assistantRes.action === "UPDATE_DRAFT" && assistantRes.updatedProduct) {
        session.draft.product = assistantRes.updatedProduct
        session.step =
          session.draft.product.suggested_price == null ? "AWAITING_PRICE" : "AWAITING_CONFIRMATION"
        activeSessions.set(cleanPhone, session)

        await this.sendDraftPreview(toPhone, session.draft, `✏️ ${assistantRes.replyMessage}`)
        return
      }

      if (assistantRes.action === "CHAT" || assistantRes.action === "HELP") {
        await this.client.sendMessage(toPhone, assistantRes.replyMessage)
        return
      }
    } catch (editorErr: any) {
      console.warn("[WhatsAppManager] Draft editor AI error, falling back to help prompt:", editorErr)
    }

    // Unrecognized text during draft confirmation
    await this.client.sendMessage(
      toPhone,
      `❓ Unrecognized command. Reply:\n- *YES* to publish\n- *PRICE <amount>* to change price\n- *TITLE <text>* to change title\n- Or simply tell me what to change (e.g. "change price to 45" or "make title Vintage Denim")\n- *CANCEL* to discard`
    )
  }

  /**
   * Switches the active vendor context for an Admin (supports name, handle, ID, or index number).
   */
  private async handleAdminSwitchVendor(
    toPhone: string,
    cleanPhone: string,
    vendorQuery: string
  ): Promise<void> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    try {
      const { data: allSellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "handle"],
      })

      if (!allSellers || allSellers.length === 0) {
        await this.client.sendMessage(toPhone, `❌ No vendors registered on the marketplace yet.`)
        return
      }

      let selected = allSellers.find(
        (s) =>
          s.id.toLowerCase() === vendorQuery.toLowerCase() ||
          s.handle?.toLowerCase() === vendorQuery.toLowerCase() ||
          s.name.toLowerCase().includes(vendorQuery.toLowerCase())
      )

      // Support index number (e.g. VENDOR 1 from SELLERS list)
      const num = parseInt(vendorQuery, 10)
      if (!selected && !isNaN(num) && num >= 1 && num <= allSellers.length) {
        selected = allSellers[num - 1]
      }

      if (!selected) {
        await this.client.sendMessage(
          toPhone,
          `❌ No vendor found matching "*${vendorQuery}*". Reply *SELLERS* to see all available vendors.`
        )
        return
      }

      adminVendorContexts.set(cleanPhone, {
        sellerId: selected.id,
        sellerName: selected.name,
        updatedAt: Date.now(),
      })

      // If an active draft exists, update the draft's target seller directly
      const session = activeSessions.get(cleanPhone)
      if (session?.draft) {
        session.draft.targetSellerId = selected.id
        session.draft.targetSellerName = selected.name
        activeSessions.set(cleanPhone, session)

        await this.sendDraftPreview(
          toPhone,
          session.draft,
          `✅ Assigned product to vendor *${selected.name}* (ID: \`${selected.id}\`)!`
        )
        return
      }

      await this.client.sendMessage(
        toPhone,
        `✅ Active vendor context set to: *${selected.name}* (ID: \`${selected.id}\`).\n\nAll subsequent product uploads and *LIST PRODUCTS* commands will now apply to this vendor.\n\nReply *CLEAR VENDOR* to return to general admin.`
      )
    } catch (e: any) {
      await this.client.sendMessage(toPhone, `⚠️ Error searching for vendor: ${e.message}`)
    }
  }

  /**
   * Lists all registered sellers for an Admin.
   */
  private async handleListSellers(toPhone: string): Promise<void> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "handle", "phone"],
      })

      if (!sellers || sellers.length === 0) {
        await this.client.sendMessage(toPhone, `ℹ️ No sellers registered yet on the marketplace.`)
        return
      }

      const lines = [`🏪 *Registered Marketplace Vendors* (${sellers.length} total):\n`]
      sellers.forEach((s, idx) => {
        lines.push(`${idx + 1}. *${s.name}* (Handle: \`${s.handle}\`, ID: \`${s.id}\`)`)
      })
      lines.push(
        `\n👉 Reply:\n• *VENDOR <number or name>* to switch active vendor to upload or query on their behalf.\n• *CLEAR VENDOR* to reset to general admin.`
      )

      await this.client.sendMessage(toPhone, lines.join("\n"))
    } catch (e: any) {
      await this.client.sendMessage(toPhone, `⚠️ Error listing sellers: ${e.message}`)
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
        ? `₹${(firstVariantPrices[0].amount / 100).toFixed(0)}`
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
      const priceStr = firstPrice ? `₹${(firstPrice / 100).toFixed(0)}` : "No price"
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

    // If admin and caption mentions a vendor (e.g. "for Bhawani" or "vendor: Bhawani")
    let targetSellerId = sellerId
    let targetSellerName = sellerName

    if (isAdmin && caption) {
      const captionMatch =
        caption.match(/(?:for|vendor|seller)\s*[:\-]?\s*([a-zA-Z0-9_\-\s]+?)(?:[,.]|$|\s+(?:price|title))/i)
      if (captionMatch) {
        const potentialVendor = captionMatch[1].trim()
        const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
        try {
          const { data: matchedSellers } = await query.graph({
            entity: "seller",
            fields: ["id", "name", "handle"],
            filters: {
              $or: [
                { name: { $ilike: `%${potentialVendor}%` } },
                { handle: { $ilike: `%${potentialVendor}%` } },
              ],
            },
          })
          if (matchedSellers && matchedSellers.length > 0) {
            targetSellerId = matchedSellers[0].id
            targetSellerName = matchedSellers[0].name
            console.log(`[WhatsAppManager] Auto-detected vendor from caption: ${targetSellerName} (${targetSellerId})`)
          }
        } catch {}
      }
    }

    if (targetSellerId) {
      ;(session as any).targetSellerId = targetSellerId
      ;(session as any).targetSellerName = targetSellerName
    }

    // Set 30-second debounce timer
    session.debounceTimer = setTimeout(async () => {
      try {
        await this.finalizeImageCollection(
          cleanPhone,
          toPhone,
          isAdmin,
          (session as any).targetSellerId || targetSellerId,
          (session as any).targetSellerName || targetSellerName
        )
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

    // 1. Download & compress images from WhatsApp Graph API
    const downloadedImages: Array<{ buffer: Buffer; mimeType: string }> = []
    for (const item of session.pendingImages) {
      try {
        const fileData = await this.client.downloadMedia(item.mediaId)
        console.log(`[WhatsAppManager] Compressing media ${item.mediaId} (${fileData.buffer.length} bytes)...`)
        const compressed = await this.compressor.compress(fileData.buffer)
        downloadedImages.push({
          buffer: compressed.buffer,
          mimeType: compressed.mimeType,
        })
      } catch (dlErr: any) {
        console.error(`[WhatsAppManager] Failed to download/compress media ${item.mediaId}:`, dlErr)
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
      const uploadInput = downloadedImages.map((img, idx) => {
        const ext = img.mimeType === "image/webp" ? "webp" : "jpg"
        return {
          filename: `whatsapp/${targetSellerId}/${Date.now()}_img_${idx + 1}.${ext}`,
          mimeType: img.mimeType,
          content: img.buffer.toString("base64"),
          access: "public" as const,
        }
      })

      const { result: uploadedFiles } = await uploadFilesWorkflow(this.container).run({
        input: { files: uploadInput },
      })

      imageUrls = (uploadedFiles as Array<{ url: string }>).map((f) => f.url)
    } catch (uploadErr: any) {
      console.warn("[WhatsAppManager] File upload workflow warning (using fallback):", uploadErr.message)
      imageUrls = downloadedImages.map((img, idx) => {
        const ext = img.mimeType === "image/webp" ? "webp" : "jpg"
        return `http://localhost:9000/static/whatsapp_img_${Date.now()}_${idx + 1}.${ext}`
      })
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

    const effectiveSellerId = (session as any).targetSellerId || sellerId || ""
    const effectiveSellerName = (session as any).targetSellerName || sellerName

    // 4. Save Draft
    const draft: ProductDraft = {
      product: extracted,
      imageUrls,
      createdAt: Date.now(),
      targetSellerId: effectiveSellerId,
      targetSellerName: effectiveSellerName,
      isAdmin: Boolean(isAdmin),
    }

    session.draft = draft
    session.step = extracted.suggested_price == null ? "AWAITING_PRICE" : "AWAITING_CONFIRMATION"

    // Step 1 complete: release raw image buffers from session.
    // Step 2 conversational editing uses the extracted text description and metadata.
    session.pendingImages = []
    delete (session as any).caption
    if (session.debounceTimer) clearTimeout(session.debounceTimer)

    console.log(
      `[WhatsAppManager] Image context released after Step 1. Transitioning to Step 2 text-only chat with description for "${extracted.title}".`
    )

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
      p.suggested_price != null ? `₹${p.suggested_price.toFixed(0)}` : "⚠️ *NOT SET*"

    const variantsText =
      p.variants?.map((v) => v.title).join(", ") || "Default"

    const vendorDisplay = draft.targetSellerName
      ? `• *Vendor*: ${draft.targetSellerName}`
      : draft.isAdmin
      ? `• *Vendor*: ⚠️ *Not Assigned* (Reply *VENDOR <name>* or *SELLERS*)`
      : ""

    const messageLines = [
      prefixMessage ? `${prefixMessage}\n` : "",
      `📦 *Product Preview*`,
      `• *Title*: ${p.title}`,
      p.subtitle ? `• *Subtitle*: ${p.subtitle}` : "",
      `• *Category*: ${p.category_name || "General"}`,
      p.material ? `• *Material*: ${p.material}` : "",
      `• *Price*: ${priceDisplay} (INR)`,
      `• *Variants*: ${variantsText}`,
      `• *Images*: ${draft.imageUrls.length} attached`,
      vendorDisplay,
      "",
      `📝 *Description*:\n${p.description.slice(0, 300)}${p.description.length > 300 ? "..." : ""}`,
      "",
    ].filter(Boolean)

    if (p.suggested_price == null) {
      messageLines.push(`👉 *Please reply with the price in INR (₹) to continue* (e.g. *PRICE 999*):`)
    } else {
      messageLines.push(`👉 Reply:`)
      messageLines.push(`- *YES* to publish globally to store`)
      messageLines.push(`- *PRICE <amount>* to change price (e.g. PRICE 1299)`)
      messageLines.push(`- *TITLE <text>* to change title`)
      if (draft.isAdmin) {
        messageLines.push(`- *VENDOR <name or number>* to assign to a vendor (or *SELLERS* to view all)`)
      }
      messageLines.push(`- *CANCEL* to discard`)
    }

    await this.client.sendMessage(toPhone, messageLines.join("\n"))
  }

  /**
   * Publishes the confirmed product globally with INR pricing using Mercur's createProductsWorkflow.
   */
  private async publishDraft(
    toPhone: string,
    cleanPhone: string,
    draft: ProductDraft
  ): Promise<void> {
    const p = draft.product
    const priceAmount = Math.round((p.suggested_price || 0) * 100)
    const currencyCode = "inr"
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch active sales channels so product is globally available across all channels
    let salesChannels: Array<{ id: string }> = []
    try {
      const { data } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
        filters: { is_disabled: false },
      })
      salesChannels = data || []
    } catch (scErr: any) {
      console.warn("[WhatsAppManager] Warning fetching sales channels:", scErr.message)
    }

    const variants =
      p.variants && p.variants.length > 0
        ? p.variants.map((v) => ({
            title: v.title || "Default",
            sku: v.sku,
            prices: [
              {
                currency_code: currencyCode,
                amount: Math.round((v.price || p.suggested_price || 0) * 100),
              },
            ],
          }))
        : [
            {
              title: "Default",
              prices: [
                {
                  currency_code: currencyCode,
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
      sales_channels: salesChannels.map((sc) => ({ id: sc.id })),
      metadata: {
        listing_scope: "global",
        created_via: "whatsapp",
        material: p.material,
      },
    }

    // For Admin: require vendor assignment so product belongs to a valid seller
    if (draft.isAdmin && !draft.targetSellerId) {
      await this.client.sendMessage(
        toPhone,
        `⚠️ *Vendor Assignment Required*\n\nPlease assign this product to a vendor before publishing.\n\n👉 Reply *VENDOR <name or number>* (or reply *SELLERS* to see all vendors).`
      )
      return
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

    // Explicitly link to all sales channels to ensure global availability
    if (salesChannels.length > 0) {
      for (const sc of salesChannels) {
        try {
          await linkProductsToSalesChannelWorkflow(this.container).run({
            input: {
              id: sc.id,
              add: [createdId],
            },
          })
        } catch {
          // If already linked by createProductsWorkflow, ignore
        }
      }
    }

    // Fetch created product for handle
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
      `🎉 *Product Published Successfully!*\n\n• *Title*: ${p.title}\n• *Price*: ₹${(p.suggested_price || 0).toFixed(0)}\n• *Scope*: 🌐 Globally Available (Marketplace & All Channels)\n• *Seller*: ${draft.targetSellerName || "Marketplace"}\n\n🌐 *View Live on Store*: ${storefrontLink}\n🛠️ *Edit in Dashboard*: ${dashboardLink}`
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
        `• *SELLERS*: View all registered marketplace vendors.`,
        `• *VENDOR <Name or Number>*: Switch active vendor to upload or query on their behalf.`,
        `• *CLEAR VENDOR*: Clear active vendor context.`
      )
    }

    lines.push(
      `\n💬 *Gemma 4 AI Assistant*:`,
      `You can chat naturally anytime! Ask questions, say "who are my sellers?", "list products for Bhawani", or "assign this draft to Nike".`
    )

    lines.push(`\nDuring draft confirmation:`, `• *YES* | *PRICE <amount>* | *TITLE <text>* | *VENDOR <name>* | *CANCEL*`)
    await this.client.sendMessage(toPhone, lines.join("\n"))
  }
}
