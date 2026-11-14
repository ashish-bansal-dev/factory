import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  uploadFilesWorkflow,
  linkProductsToSalesChannelWorkflow,
  createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createProductsWorkflow,
  createBrandWorkflow,
  linkProductBrandWorkflow,
  createProductAttributeValuesWorkflow,
} from "@mercurjs/core/workflows"
import { BrandStatus, AttributeType } from "@mercurjs/types"
import { GeminiVisionService } from "./gemini-vision"
import { WhatsAppClient } from "./whatsapp-client"
import { ImageCompressor } from "./image-compressor"
import { DraftEditorService } from "./draft-editor"
import { WhatsAppConfigService, WhatsAppAiConfig } from "./config-service"
import {
  AdminVendorContext,
  ExtractedProduct,
  ProductDraft,
  WhatsAppSession,
  WhatsAppWebhookBody,
} from "./types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// In-memory cache for active sessions and admin vendor context
const activeSessions = new Map<string, WhatsAppSession>()
const adminVendorContexts = new Map<string, AdminVendorContext>()
const catalogPagination = new Map<string, { offset: number; sellerId?: string }>()

export class WhatsAppManager {
  private container: MedusaContainer
  private configService: WhatsAppConfigService
  private client: WhatsAppClient
  private vision: GeminiVisionService
  private compressor: ImageCompressor
  private draftEditor: DraftEditorService
  private adminPhone: string
  private storefrontUrl: string
  private vendorUrl: string

  constructor(container: MedusaContainer, configService?: WhatsAppConfigService) {
    this.container = container
    this.configService = configService || new WhatsAppConfigService(container)
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

  /**
   * Dynamically loads API credentials and tokens from the database, falling back to environment variables.
   */
  async loadConfig(): Promise<WhatsAppAiConfig> {
    const config = await this.configService.getConfig()
    this.client = new WhatsAppClient({
      verifyToken: config.whatsapp_verify_token,
      phoneNumberId: config.whatsapp_phone_number_id,
      accessToken: config.whatsapp_access_token,
    })
    this.vision = new GeminiVisionService(config.gemini_api_key, config.gemini_model)
    this.draftEditor = new DraftEditorService(config.gemini_api_key, config.text_model)
    if (config.admin_whatsapp_phone) {
      this.adminPhone = config.admin_whatsapp_phone
    }
    if (config.storefront_url) {
      this.storefrontUrl = config.storefront_url.replace(/\/+$/, "")
    }
    if (config.vendor_url) {
      this.vendorUrl = config.vendor_url.replace(/\/+$/, "")
    }
    return config
  }

  private getAdminPhone(): string {
    return this.adminPhone || (process.env.ADMIN_WHATSAPP_PHONE || "").replace(/[^0-9]/g, "")
  }

  /**
   * Main webhook event processor.
   */
  async handleWebhookPayload(payload: WhatsAppWebhookBody): Promise<void> {
    await this.loadConfig()
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
   * Supports 10-digit numbers (with or without 91 or +91 country prefix).
   */
  private async authenticateSender(cleanPhone: string): Promise<{
    isAdmin: boolean
    sellerId?: string
    sellerName?: string
  } | null> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const adminPhone = this.getAdminPhone()
    const cleanAdmin = (adminPhone || "").replace(/[^0-9]/g, "")
    const cleanSender = cleanPhone.replace(/[^0-9]/g, "")
    const last10Admin = cleanAdmin.slice(-10)
    const last10Sender = cleanSender.slice(-10)

    console.log(
      `[WhatsAppManager] Authenticating ${cleanPhone} (10-digit: ${last10Sender}) against Admin (${adminPhone || "none"}, 10-digit: ${last10Admin || "none"})`
    )

    // Check Admin (matches last 10 digits or endsWith)
    const isAdmin = Boolean(
      cleanAdmin &&
        ((last10Admin.length === 10 && last10Admin === last10Sender) ||
          cleanSender.endsWith(cleanAdmin) ||
          cleanAdmin.endsWith(cleanSender))
    )

    if (isAdmin) {
      const adminCtx = adminVendorContexts.get(cleanPhone)
      return {
        isAdmin: true,
        sellerId: adminCtx?.sellerId,
        sellerName: adminCtx?.sellerName || "Marketplace Admin",
      }
    }

    // Query seller table for matching phone
    try {
      const phoneVariants = Array.from(
        new Set(
          [
            cleanPhone,
            `+${cleanPhone}`,
            last10Sender,
            `+91${last10Sender}`,
            `91${last10Sender}`,
            `0${last10Sender}`,
          ].filter(Boolean)
        )
      )

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

      // Secondary check: match last 10 digits across all sellers in case of irregular stored formatting
      const { data: allSellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "phone"],
        pagination: { skip: 0, take: 100 },
      })
      const matchedSeller = allSellers?.find((s: any) => {
        if (!s.phone) return false
        const sClean = s.phone.replace(/[^0-9]/g, "")
        return sClean.slice(-10) === last10Sender && last10Sender.length === 10
      })

      if (matchedSeller) {
        return {
          isAdmin: false,
          sellerId: matchedSeller.id,
          sellerName: matchedSeller.name,
        }
      }
    } catch (e: any) {
      console.error("[WhatsAppManager] Seller query error:", e)
    }

    return null
  }

  /**
   * Text message handler for commands, state updates, accompanying notes, and queries.
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

    // 5. Additional message sent with images: include in product data extraction pipeline!
    // If the session is currently collecting images in a batch (within the 4-second window),
    // buffer the accompanying text message and reset debounce timer.
    const activeSession = activeSessions.get(cleanPhone)
    if (activeSession && activeSession.step === "COLLECTING_IMAGES" && activeSession.pendingImages.length > 0) {
      activeSession.pendingTexts.push(rawText.trim())
      activeSession.lastUpdated = Date.now()

      if (activeSession.debounceTimer) clearTimeout(activeSession.debounceTimer)
      activeSession.debounceTimer = setTimeout(async () => {
        try {
          await this.finalizeImageCollection(
            cleanPhone,
            toPhone,
            isAdmin,
            (activeSession as any).targetSellerId || currentSellerId,
            (activeSession as any).targetSellerName || currentSellerName
          )
        } catch (err: any) {
          console.error("[WhatsAppManager] Debounce processing failed:", err)
          await this.client.sendMessage(toPhone, `⚠️ Failed to process product images: ${err.message}`)
        }
      }, 4000)

      console.log(`[WhatsAppManager] Added accompanying message to pending image batch for ${cleanPhone}: "${rawText}"`)
      return
    }

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
      // General conversation and handling with AI
      try {
        const assistantRes = await this.draftEditor.processConversation(
          {
            isAdmin,
            sellerId: currentSellerId,
            sellerName: currentSellerName,
            availableSellers,
            hasDraft: false,
            conversationHistory: session?.conversationHistory || [],
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

    // 3. Keep all data in context of AI until publish is done!
    // Record incoming user message in conversation history
    session.conversationHistory.push({
      role: "user",
      content: rawText,
      timestamp: Date.now(),
    })

    // Draft Actions: CANCEL
    if (textUpper === "CANCEL" || textUpper === "DISCARD") {
      activeSessions.delete(cleanPhone)
      await this.client.sendMessage(toPhone, `🗑️ Product draft has been cancelled and discarded.`)
      return
    }

    // Draft Actions: WHOLESALE <amount>
    if (textUpper.startsWith("WHOLESALE ") || textUpper.startsWith("WS ")) {
      const priceStr = rawText.replace(/^(WHOLESALE|WS)\s*[₹$]?/i, "").trim()
      const newWs = parseFloat(priceStr)
      if (isNaN(newWs) || newWs <= 0) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a valid wholesale unit price in INR, e.g. *WHOLESALE 350*`)
        return
      }

      session.draft.product.wholesale_price = newWs
      const { variants, retailVariants, wholesaleVariants } = await this.buildAttributesAndVariants(
        session.draft.product,
        session.draft.product.currency_code || "inr",
        Math.round((session.draft.product.suggested_price || session.draft.product.mrp || 0) * 100)
      )
      session.draft.product.variants = variants
      session.draft.product.retail_variants = retailVariants
      session.draft.product.wholesale_variants = wholesaleVariants

      activeSessions.set(cleanPhone, session)
      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated wholesale unit rate to *₹${newWs}*!`)
      return
    }

    // Draft Actions: MRP <amount>
    if (textUpper.startsWith("MRP ")) {
      const priceStr = rawText.replace(/^MRP\s*[₹$]?/i, "").trim()
      const newMrp = parseFloat(priceStr)
      if (isNaN(newMrp) || newMrp <= 0) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a valid MRP in INR, e.g. *MRP 1299*`)
        return
      }

      session.draft.product.mrp = newMrp
      if (session.draft.product.suggested_price == null) {
        session.draft.product.suggested_price = newMrp
      }
      if (session.draft.product.wholesale_price == null) {
        session.draft.product.wholesale_price = Math.round(newMrp * 0.5)
      }

      const { variants, retailVariants, wholesaleVariants } = await this.buildAttributesAndVariants(
        session.draft.product,
        session.draft.product.currency_code || "inr",
        Math.round((session.draft.product.suggested_price || newMrp) * 100)
      )
      session.draft.product.variants = variants
      session.draft.product.retail_variants = retailVariants
      session.draft.product.wholesale_variants = wholesaleVariants

      activeSessions.set(cleanPhone, session)
      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated MRP to *₹${newMrp}*!`)
      return
    }

    // Draft Actions: PRICE <amount> or RETAIL <amount>
    if (
      textUpper.startsWith("PRICE ") ||
      textUpper.startsWith("RETAIL ") ||
      /^[₹\$]?\d+(\.\d+)?$/.test(rawText)
    ) {
      const priceStr = rawText.replace(/^(PRICE|RETAIL)\s*/i, "").replace(/[^0-9.]/g, "")
      const newPrice = parseFloat(priceStr)
      if (isNaN(newPrice) || newPrice <= 0) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter a valid price in INR, e.g. *PRICE 1499*`)
        return
      }

      session.draft.product.suggested_price = newPrice
      session.draft.product.currency_code = "inr"
      if (session.draft.product.mrp == null) {
        session.draft.product.mrp = newPrice
      }
      if (session.draft.product.wholesale_price == null) {
        session.draft.product.wholesale_price = Math.round(newPrice * 0.5)
      }

      const { variants, retailVariants, wholesaleVariants } = await this.buildAttributesAndVariants(
        session.draft.product,
        session.draft.product.currency_code || "inr",
        Math.round(newPrice * 100)
      )
      session.draft.product.variants = variants
      session.draft.product.retail_variants = retailVariants
      session.draft.product.wholesale_variants = wholesaleVariants

      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated retail price to *₹${newPrice}*!`)
      return
    }

    // Draft Actions: ART <number> or TITLE <text>
    if (textUpper.startsWith("ART ") || textUpper.startsWith("ARTICLE ") || textUpper.startsWith("TITLE ")) {
      const newTitle = rawText.replace(/^(ART|ARTICLE|TITLE)\s+/i, "").trim()
      if (!newTitle) {
        await this.client.sendMessage(toPhone, `⚠️ Please enter an article number or title, e.g. *ART 502*`)
        return
      }

      session.draft.product.title = newTitle
      session.draft.product.article_number = newTitle
      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated article title to *${newTitle}*!`)
      return
    }

    // Draft Actions: CATEGORY <categories> (Multi-select)
    if (textUpper.startsWith("CATEGORY ") || textUpper.startsWith("CATEGORIES ")) {
      const catStr = rawText.replace(/^(CATEGOR(Y|IES))\s+/i, "").trim()
      const cats = catStr.split(/[,&]+/).map((c) => c.trim()).filter(Boolean)
      if (!cats.length) {
        await this.client.sendMessage(toPhone, `⚠️ Please provide one or more categories separated by commas, e.g. *CATEGORY Footwear, Casual*`)
        return
      }

      session.draft.product.category_names = cats
      session.draft.product.category_name = cats[0]

      const resolved = await this.resolveSystemCategories(cats)
      if (resolved.length > 0) {
        session.draft.product.category_ids = resolved.map((r) => r.id)
        session.draft.product.category_names = resolved.map((r) => r.name)
        session.draft.product.category_name = resolved[0].name
      }

      session.step = "AWAITING_CONFIRMATION"
      activeSessions.set(cleanPhone, session)

      await this.sendDraftPreview(toPhone, session.draft, `✅ Updated categories to: *${session.draft.product.category_names.join(", ")}*!`)
      return
    }

    // Draft Actions: YES / CONFIRM / PUBLISH
    if (textUpper === "YES" || textUpper === "CONFIRM" || textUpper === "PUBLISH") {
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

    // Natural Language Draft Edits via AI with full multi-turn context
    try {
      const assistantRes = await this.draftEditor.processConversation(
        {
          isAdmin,
          sellerId: session.draft.targetSellerId,
          sellerName: session.draft.targetSellerName,
          availableSellers,
          hasDraft: true,
          draftProduct: session.draft.product,
          conversationHistory: session.conversationHistory,
        },
        rawText
      )

      session.conversationHistory.push({
        role: "assistant",
        content: assistantRes.replyMessage,
        timestamp: Date.now(),
      })

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

        // Rebuild retail and wholesale variants if needed
        const { variants, retailVariants, wholesaleVariants } = await this.buildAttributesAndVariants(
          session.draft.product,
          session.draft.product.currency_code || "inr",
          Math.round((session.draft.product.suggested_price || session.draft.product.mrp || 0) * 100)
        )
        session.draft.product.variants = variants
        session.draft.product.retail_variants = retailVariants
        session.draft.product.wholesale_variants = wholesaleVariants

        session.step = "AWAITING_CONFIRMATION"
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
      `❓ Unrecognized command. Reply:\n- *YES* to publish\n- *PRICE <amount>* for retail price\n- *WHOLESALE <rate>* for wholesale price\n- *MRP <amount>* for MRP\n- *ART <number>* for article code\n- *CATEGORY <cats>* for multi-select categories\n- Or tell me naturally what to update\n- *CANCEL* to discard`
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
    sellerId?: string,
    sellerName?: string
  ): Promise<void> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const textUpper = rawText.toUpperCase()

    // 1. Single product detail inspect: PRODUCT <number>
    const matchProdIndex = rawText.match(/^PRODUCT\s+(\d+)$/i)
    if (matchProdIndex) {
      const index = parseInt(matchProdIndex[1], 10)
      const currentPagination = catalogPagination.get(cleanPhone)
      const effectiveSellerId = currentPagination?.sellerId || sellerId

      try {
        const filters: any = { status: ProductStatus.PUBLISHED }
        if (effectiveSellerId) {
          filters.seller_id = effectiveSellerId
        }

        const { data: products } = await query.graph({
          entity: "product",
          fields: ["id", "title", "handle", "description", "variants.id", "variants.title"],
          filters,
          pagination: { skip: index - 1 >= 0 ? index - 1 : 0, take: 1 },
        })

        if (!products || products.length === 0) {
          await this.client.sendMessage(toPhone, `❌ Product #${index} not found. Reply *LIST PRODUCTS* to browse your inventory.`)
          return
        }

        const p = products[0]
        const storefrontUrl = `${this.storefrontUrl}/products/${p.handle || p.id}`
        const dashboardUrl = effectiveSellerId
          ? `${this.vendorUrl}/products/${p.id}`
          : `${this.storefrontUrl}/admin/products/${p.id}`

        const detailMsg = [
          `📦 *Product #${index} Details*`,
          `• *Title*: ${p.title}`,
          `• *Variants*: ${p.variants?.map((v: any) => v.title).join(", ") || "Default"}`,
          p.description ? `• *Description*: ${p.description.slice(0, 200)}` : "",
          "",
          `🌐 *Storefront Link*: ${storefrontUrl}`,
          `🛠️ *Dashboard Edit*: ${dashboardUrl}`,
        ].filter(Boolean).join("\n")

        await this.client.sendMessage(toPhone, detailMsg)
        return
      } catch (err: any) {
        await this.client.sendMessage(toPhone, `⚠️ Error retrieving product details: ${err.message}`)
        return
      }
    }

    // 2. Paginated List Products
    let paginationState = catalogPagination.get(cleanPhone)
    let offset = 0

    if (textUpper === "NEXT" && paginationState) {
      offset = paginationState.offset + 5
    } else {
      offset = 0
    }

    try {
      const filters: any = { status: ProductStatus.PUBLISHED }
      if (sellerId) {
        filters.seller_id = sellerId
      }

      const { data: products, metadata } = await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "variants.id"],
        filters,
        pagination: { skip: offset, take: 5 },
      })

      if (!products || products.length === 0) {
        if (offset > 0) {
          catalogPagination.delete(cleanPhone)
          await this.client.sendMessage(
            toPhone,
            `🏁 You have reached the end of the product catalog. Reply *LIST PRODUCTS* to start from the beginning.`
          )
          return
        }
        await this.client.sendMessage(
          toPhone,
          `ℹ️ No published products found${sellerName ? ` for *${sellerName}*` : ""}. Send 1 or more photos to create your first product!`
        )
        return
      }

      catalogPagination.set(cleanPhone, { offset, sellerId })

      const totalCount = metadata?.count ?? "several"
      const titleLine = sellerName
        ? `📦 *Products for ${sellerName}* (${offset + 1}-${offset + products.length} of ${totalCount}):\n`
        : `📦 *Product Inventory* (${offset + 1}-${offset + products.length} of ${totalCount}):\n`
      const lines = [titleLine]

      products.forEach((p, idx) => {
        const itemNumber = offset + idx + 1
        lines.push(`${itemNumber}. *${p.title}*`)
      })

      lines.push(`\n👉 Reply:\n• *PRODUCT <number>* for direct product links and variant details.\n• *NEXT* for the next 5 products.`)
      await this.client.sendMessage(toPhone, lines.join("\n"))
    } catch (err: any) {
      await this.client.sendMessage(toPhone, `⚠️ Error listing products: ${err.message}`)
    }
  }

  /**
   * Handles incoming image messages: treats images sent together as a single batch
   * with a 4-second debounce timer, without asking for 'DONE'.
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
        pendingTexts: [],
        captions: [],
        conversationHistory: [],
        lastUpdated: Date.now(),
      }
      activeSessions.set(cleanPhone, session)
    }

    // Reset step if previous draft was finalized/cancelled
    if (session.step === "AWAITING_CONFIRMATION" || session.step === "AWAITING_PRICE") {
      session.step = "COLLECTING_IMAGES"
      session.pendingImages = []
      session.pendingTexts = []
      session.captions = []
      session.draft = undefined
    }

    // Buffer image
    session.pendingImages.push({ mediaId, mimeType })
    session.lastUpdated = Date.now()

    // Store caption on session if provided
    if (caption && caption.trim()) {
      session.captions.push(caption.trim())
    }

    // Clear previous debounce timer if active
    if (session.debounceTimer) {
      clearTimeout(session.debounceTimer)
    }

    // Check if admin caption mentions a vendor (e.g. "for Bhawani" or "vendor: Bhawani")
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

    // 4-second debounce timer: treats images sent together as a single batch without asking for 'DONE'
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
    }, 4000)
  }

  /**
   * Downloads buffered batch of images, uploads to Medusa File Service, runs Gemini Vision,
   * extracts article number, MRP, wholesale/retail variants, multi-select categories,
   * and retains all context.
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
      session.pendingTexts = []
      session.captions = []
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

    // 3. Combine captions and additional accompanying text messages into pipeline
    const combinedNotes: string[] = [
      ...session.captions,
      ...session.pendingTexts,
    ].filter(Boolean)

    // 4. Multimodal Analysis with Gemini Vision
    let extracted: ExtractedProduct
    try {
      const systemCategories = await this.getSystemCategories()
      const categoryNames = systemCategories.map((c) => c.name)
      extracted = await this.vision.extractProductDetails(downloadedImages, combinedNotes, categoryNames)
      console.log(`[WhatsAppManager] Successfully extracted Article/Title: "${extracted.title}"`)

      // Resolve multiple categories (multi-select)
      const categoriesToResolve =
        extracted.category_names && extracted.category_names.length > 0
          ? extracted.category_names
          : extracted.category_name
          ? [extracted.category_name]
          : []

      if (categoriesToResolve.length > 0) {
        const resolvedCats = await this.resolveSystemCategories(categoriesToResolve, systemCategories)
        if (resolvedCats.length > 0) {
          extracted.category_ids = resolvedCats.map((c) => c.id)
          extracted.category_names = resolvedCats.map((c) => c.name)
          extracted.category_id = resolvedCats[0].id
          extracted.category_name = resolvedCats[0].name
        }
      }
    } catch (aiErr: any) {
      console.error("[WhatsAppManager] Gemini extraction failed:", aiErr)
      await this.client.sendMessage(
        toPhone,
        `⚠️ AI analysis failed: ${aiErr.message || "Unknown error"}. Please try again.`
      )
      session.pendingImages = []
      session.pendingTexts = []
      session.captions = []
      activeSessions.set(cleanPhone, session)
      return
    }

    // 5. Build Retail and Wholesale variants
    const currencyCode = extracted.currency_code || "inr"
    const effectivePriceAmount = Math.round(
      (extracted.suggested_price || extracted.mrp || 0) * 100
    )
    const { variants, retailVariants, wholesaleVariants } = await this.buildAttributesAndVariants(
      extracted,
      currencyCode,
      effectivePriceAmount
    )
    extracted.variants = variants
    extracted.retail_variants = retailVariants
    extracted.wholesale_variants = wholesaleVariants

    const effectiveSellerId = (session as any).targetSellerId || sellerId || ""
    const effectiveSellerName = (session as any).targetSellerName || sellerName

    // 6. Save Draft and maintain full conversational context
    const draft: ProductDraft = {
      product: extracted,
      imageUrls,
      createdAt: Date.now(),
      targetSellerId: effectiveSellerId,
      targetSellerName: effectiveSellerName,
      isAdmin: Boolean(isAdmin),
      rawCaptionsAndMessages: combinedNotes,
    }

    session.draft = draft
    session.step = "AWAITING_CONFIRMATION"

    // Multi-turn context retained until published completely
    session.conversationHistory.push({
      role: "user",
      content: `Sent ${downloadedImages.length} photo(s)${
        combinedNotes.length ? ` with note: "${combinedNotes.join("; ")}"` : ""
      }`,
      timestamp: Date.now(),
    })
    session.conversationHistory.push({
      role: "assistant",
      content: `Extracted Article "${extracted.title}", MRP: ${
        extracted.mrp ? `₹${extracted.mrp}` : "N/A"
      }, Retail: ${
        extracted.suggested_price ? `₹${extracted.suggested_price}` : "N/A"
      }, Wholesale: ${
        extracted.wholesale_price ? `₹${extracted.wholesale_price}` : "N/A"
      }, Categories: ${extracted.category_names?.join(", ") || "General"}.`,
      timestamp: Date.now(),
    })

    // Reset media buffer for next operations while keeping conversation history & draft
    session.pendingImages = []
    session.pendingTexts = []
    session.captions = []
    if (session.debounceTimer) clearTimeout(session.debounceTimer)

    activeSessions.set(cleanPhone, session)

    // 7. Send Preview
    await this.sendDraftPreview(toPhone, draft)
  }

  /**
   * Formats and sends the product preview message to WhatsApp with MRP, Retail, Wholesale, and Categories.
   */
  private async sendDraftPreview(
    toPhone: string,
    draft: ProductDraft,
    prefixMessage?: string
  ): Promise<void> {
    const p = draft.product
    const mrpDisplay = p.mrp != null ? `₹${p.mrp.toFixed(0)}` : "Optional (Not set)"
    const retailDisplay =
      p.suggested_price != null ? `₹${p.suggested_price.toFixed(0)}` : "Optional (Not set)"
    const wholesaleUnitDisplay =
      p.wholesale_price != null ? `₹${p.wholesale_price.toFixed(0)}/pair` : "Optional (Not set)"

    const categoriesDisplay = p.category_names?.length
      ? p.category_names.join(", ")
      : p.category_name || "General"

    const retailVariantsCount = p.retail_variants?.length || p.sizes?.length || 1
    const wholesaleVariant = p.wholesale_variants?.[0]
    const wholesalePackPrice =
      wholesaleVariant?.prices?.[0]?.amount != null
        ? `₹${(wholesaleVariant.prices[0].amount / 100).toFixed(0)}`
        : wholesaleVariant?.price != null
        ? `₹${wholesaleVariant.price.toFixed(0)}`
        : "Optional (Not set)"
    const wholesalePackDisplay = wholesaleVariant
      ? `• *Wholesale Pack*: ${wholesalePackPrice} (${wholesaleVariant.bundle_size || p.sizes?.length || 1} pcs${p.wholesale_price != null ? ` @ ${wholesaleUnitDisplay}` : ""})`
      : `• *Wholesale Rate*: ${wholesaleUnitDisplay}`

    const vendorDisplay = draft.targetSellerName
      ? `• *Vendor*: ${draft.targetSellerName}`
      : draft.isAdmin
      ? `• *Vendor*: ⚠️ *Not Assigned* (Reply *VENDOR <name>* or *SELLERS*)`
      : ""

    const sizesText = p.sizes?.length ? p.sizes.join(", ") : "Free Size"
    const colorsText = p.colors?.length ? p.colors.join(", ") : ""

    const messageLines = [
      prefixMessage ? `${prefixMessage}\n` : "",
      `📦 *Product Preview*`,
      `• *Article No / Title*: *${p.title}*`,
      p.subtitle ? `• *Subtitle*: ${p.subtitle}` : "",
      `• *Brand*: ${p.brand || "Unbranded / Generic"}`,
      `• *Categories*: ${categoriesDisplay}`,
      `• *Sizes*: ${sizesText}`,
      colorsText ? `• *Colors*: ${colorsText}` : "",
      p.material ? `• *Material*: ${p.material}` : "",
      `• *MRP*: ${mrpDisplay}`,
      `• *Sale Price*: ${retailDisplay}`,
      `• *Wholesale Rate*: ${wholesaleUnitDisplay}`,
      wholesalePackDisplay,
      `• *Retail Variants*: ${retailVariantsCount} size variant(s)`,
      `• *Images*: ${draft.imageUrls.length} attached`,
      vendorDisplay,
      "",
      `📝 *Description*:\n${p.description.slice(0, 300)}${p.description.length > 300 ? "..." : ""}`,
      "",
      `👉 Reply:`,
      `- *YES* to publish to store`,
      `- *PRICE <amount>* to set sale price`,
      `- *WHOLESALE <amount>* to set wholesale unit rate`,
      `- *MRP <amount>* to set MRP`,
      `- *ART <number>* to change article title`,
      `- *CATEGORY <name, ...>* to set categories (multi-select)`,
      `- *BRAND <name>* to set brand`,
      `- *SIZE <sizes>* / *COLOR <colors>* to set attributes`,
      ...(draft.isAdmin ? [`- *VENDOR <name or number>* to assign to a vendor`] : []),
      `- *CANCEL* to discard`,
    ].filter(Boolean)

    await this.client.sendMessage(toPhone, messageLines.join("\n"))
  }

  /**
   * Publishes the confirmed product globally with retail and wholesale variants.
   */
  private async publishDraft(
    toPhone: string,
    cleanPhone: string,
    draft: ProductDraft
  ): Promise<void> {
    const p = draft.product
    const currencyCode = (p.currency_code || "inr").toLowerCase()
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // For Admin: require vendor assignment so product belongs to a valid seller
    if (draft.isAdmin && !draft.targetSellerId) {
      await this.client.sendMessage(
        toPhone,
        `⚠️ *Vendor Assignment Required*\n\nPlease assign this product to a vendor before publishing.\n\n👉 Reply *VENDOR <name or number>* (or reply *SELLERS* to see all vendors).`
      )
      return
    }

    // 1. Fetch active sales channels so product is globally available across all channels
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

    // 2. Resolve Multi-select Categories from the system
    const categoriesToResolve =
      p.category_names && p.category_names.length > 0
        ? p.category_names
        : p.category_name
        ? [p.category_name]
        : []
    const resolvedCategories = await this.resolveSystemCategories(categoriesToResolve)
    const resolvedCategoryIds = resolvedCategories.map((c) => c.id)

    // 3. Resolve Brand from system or auto-create if not in system
    let brandId = p.brand_id
    if (!brandId && p.brand) {
      brandId = (await this.resolveOrCreateBrand(p.brand, draft.targetSellerId)) || undefined
      if (brandId) p.brand_id = brandId
    }

    // 4. Build Attributes, Retail Variants, and Wholesale Variants
    const effectivePriceAmount = Math.round((p.suggested_price || p.mrp || 0) * 100)
    const { attributes, variants } = await this.buildAttributesAndVariants(p, currencyCode, effectivePriceAmount)

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
        article_number: p.article_number || p.title,
        mrp: p.mrp,
        suggested_retail_price: p.suggested_price,
        wholesale_unit_price: p.wholesale_price,
        material: p.material,
        brand_name: p.brand || undefined,
        category_name: p.category_name || undefined,
        category_names: p.category_names || undefined,
      },
    }

    if (resolvedCategoryIds.length > 0) {
      productPayload.category_ids = resolvedCategoryIds
    }

    if (brandId) {
      productPayload.brand_id = brandId
    }

    if (attributes.length > 0) {
      productPayload.attributes = attributes
    }

    if (draft.targetSellerId) {
      productPayload.seller_ids = [draft.targetSellerId]
    }

    // 5. Run createProductsWorkflow
    const { result } = await createProductsWorkflow(this.container).run({
      input: {
        products: [productPayload],
        created_by: draft.targetSellerId || "whatsapp_bot",
      },
    })

    const createdId = (result as { id: string }[])[0].id

    // 6. Explicitly link Brand if created/resolved
    if (brandId) {
      try {
        await linkProductBrandWorkflow(this.container).run({
          input: {
            id: createdId,
            add: [brandId],
          },
        })
      } catch (brandLinkErr: any) {
        console.warn("[WhatsAppManager] linkProductBrandWorkflow note:", brandLinkErr.message)
      }
    }

    // 7. Explicitly link to all sales channels to ensure global availability
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

    const brandDisplay = p.brand ? `\n• *Brand*: ${p.brand}` : ""
    const categoryDisplay = p.category_names?.length
      ? `\n• *Categories*: ${p.category_names.join(", ")}`
      : p.category_name
      ? `\n• *Category*: ${p.category_name}`
      : ""
    const sizesDisplay = p.sizes?.length ? `\n• *Sizes*: ${p.sizes.join(", ")}` : ""
    const mrpDisplay = p.mrp ? `\n• *MRP*: ₹${p.mrp.toFixed(0)}` : ""
    const retailDisplay = p.suggested_price ? `\n• *Retail Price*: ₹${p.suggested_price.toFixed(0)}` : ""
    const wholesaleDisplay = p.wholesale_price ? `\n• *Wholesale Rate*: ₹${p.wholesale_price.toFixed(0)}/pair` : ""
    const variantsCount = variants.length > 1 ? ` (${variants.length} variants: retail & wholesale)` : ""

    await this.client.sendMessage(
      toPhone,
      `🎉 *Product Published Successfully!*\n\n• *Article / Title*: ${p.title}${brandDisplay}${categoryDisplay}${mrpDisplay}${retailDisplay}${wholesaleDisplay}${variantsCount}${sizesDisplay}\n• *Scope*: 🌐 Globally Available (Marketplace & All Channels)\n• *Seller*: ${draft.targetSellerName || "Marketplace"}\n\n🌐 *View Live on Store*: ${storefrontLink}\n🛠️ *Edit in Dashboard*: ${dashboardLink}`
    )
  }

  /**
   * Fetches existing product categories from the system.
   */
  async getSystemCategories(): Promise<Array<{ id: string; name: string; handle: string }>> {
    try {
      const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
        pagination: { skip: 0, take: 200 },
      })
      return (data || []) as Array<{ id: string; name: string; handle: string }>
    } catch (err: any) {
      console.warn("[WhatsAppManager] Failed to fetch system categories:", err.message)
      return []
    }
  }

  /**
   * Resolves multiple category names to system categories (multi-select).
   */
  async resolveSystemCategories(
    categoryNames: string[],
    prefetchedCategories?: Array<{ id: string; name: string; handle: string }>
  ): Promise<Array<{ id: string; name: string }>> {
    const categories = prefetchedCategories || (await this.getSystemCategories())
    const results: Array<{ id: string; name: string }> = []
    const seenIds = new Set<string>()

    for (const name of categoryNames) {
      if (!name || !name.trim()) continue
      const resolved = await this.resolveSystemCategory(name, categories)
      if (resolved && !seenIds.has(resolved.id)) {
        seenIds.add(resolved.id)
        results.push(resolved)
      }
    }

    return results
  }

  /**
   * Resolves a category name to a system product_category, or auto-creates it in the system.
   */
  async resolveSystemCategory(
    categoryName?: string,
    prefetchedCategories?: Array<{ id: string; name: string; handle: string }>
  ): Promise<{ id: string; name: string } | null> {
    if (!categoryName || !categoryName.trim()) return null

    const clean = categoryName.trim()
    const cleanLower = clean.toLowerCase()
    const categories = prefetchedCategories || (await this.getSystemCategories())

    // 1. Exact match by name or handle
    const exactMatch = categories.find(
      (c) => c.name.toLowerCase() === cleanLower || c.handle.toLowerCase() === cleanLower
    )
    if (exactMatch) return { id: exactMatch.id, name: exactMatch.name }

    // 2. Substring match
    const subMatch = categories.find(
      (c) =>
        c.name.toLowerCase().includes(cleanLower) ||
        cleanLower.includes(c.name.toLowerCase())
    )
    if (subMatch) return { id: subMatch.id, name: subMatch.name }

    // 3. If no matching system category found, create it in the system
    try {
      console.log(`[WhatsAppManager] Category "${clean}" not in system. Auto-creating product category...`)
      const handle = slugify(clean)
      const { result: created } = await createProductCategoriesWorkflow(this.container).run({
        input: {
          product_categories: [
            {
              name: clean,
              handle: handle || `cat-${Date.now()}`,
              is_active: true,
            },
          ],
        },
      })
      const newCat = (created as any[])?.[0]
      if (newCat) {
        return { id: newCat.id, name: newCat.name }
      }
    } catch (createErr: any) {
      console.warn(`[WhatsAppManager] Failed to auto-create category "${clean}":`, createErr.message)
    }

    return null
  }

  /**
   * Checks if the brand exists in the system; if not, creates it via createBrandWorkflow.
   */
  async resolveOrCreateBrand(
    brandName: string,
    sellerId?: string
  ): Promise<string | null> {
    const clean = brandName.trim()
    if (!clean) return null

    const handle = slugify(clean)
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // 1. Check if brand exists in system
    try {
      const { data: existingBrands } = await query.graph({
        entity: "brand",
        fields: ["id", "name", "handle"],
        pagination: { skip: 0, take: 100 },
      })

      const match = existingBrands?.find(
        (b: any) =>
          b.name?.toLowerCase() === clean.toLowerCase() ||
          b.handle?.toLowerCase() === handle
      )
      if (match) {
        return match.id
      }
    } catch (queryErr: any) {
      console.warn("[WhatsAppManager] Warning querying brands:", queryErr.message)
    }

    // 2. Brand not found in system -> Auto-create brand
    try {
      console.log(`[WhatsAppManager] Brand "${clean}" not found in system. Auto-creating brand...`)
      const { result: createdBrand } = await createBrandWorkflow(this.container).run({
        input: {
          name: clean,
          handle: handle || `brand-${Date.now()}`,
          status: BrandStatus.APPROVED,
          seller_ids: sellerId ? [sellerId] : [],
        },
      })
      return createdBrand.id
    } catch (createBrandErr: any) {
      console.error(`[WhatsAppManager] Failed to auto-create brand "${clean}":`, createBrandErr)
      return null
    }
  }

  /**
   * Builds product attributes, retail variants, and wholesale variants.
   * Retail variants are created individually for each size/color with MRP and retail price.
   * Wholesale pack variant is created as an assorted bundle with pack breakdown and wholesale price.
   */
  async buildAttributesAndVariants(
    product: ExtractedProduct,
    currencyCode: string,
    priceAmount: number
  ): Promise<{
    attributes: any[]
    variants: any[]
    retailVariants: any[]
    wholesaleVariants: any[]
  }> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // Determine sizes & colors
    let sizes = product.sizes && product.sizes.length > 0 ? product.sizes : []
    let colors = product.colors && product.colors.length > 0 ? product.colors : []

    if (!sizes.length && product.options) {
      const sizeOpt = product.options.find((o) => /size/i.test(o.title))
      if (sizeOpt && sizeOpt.values?.length) {
        sizes = sizeOpt.values
      }
    }
    if (!colors.length && product.options) {
      const colorOpt = product.options.find((o) => /colou?r/i.test(o.title))
      if (colorOpt && colorOpt.values?.length) {
        colors = colorOpt.values
      }
    }

    // Query system global attributes
    let systemAttrs: any[] = []
    try {
      const { data } = await query.graph({
        entity: "product_attribute",
        fields: ["id", "handle", "name", "is_variant_axis", "values.id", "values.name"],
        filters: { product_id: null },
      })
      systemAttrs = data || []
    } catch (attrErr: any) {
      console.warn("[WhatsAppManager] Warning fetching system attributes:", attrErr.message)
    }

    const sizeAttr = systemAttrs.find((a: any) => a.handle === "size" || /^size$/i.test(a.name))
    const colorAttr = systemAttrs.find((a: any) => a.handle === "color" || /^colou?r$/i.test(a.name))

    const attributes: any[] = []

    // 1. Resolve Size Attribute
    if (sizes.length > 0) {
      if (sizeAttr) {
        const sizeValueIds: string[] = []
        const missingSizes: string[] = []

        for (const s of sizes) {
          const val = sizeAttr.values?.find(
            (v: any) => v.name?.toLowerCase() === s.toLowerCase()
          )
          if (val) {
            sizeValueIds.push(val.id)
          } else {
            missingSizes.push(s)
          }
        }

        if (missingSizes.length > 0) {
          try {
            const { result: createdVals } = await createProductAttributeValuesWorkflow(this.container).run({
              input: {
                attribute_id: sizeAttr.id,
                values: missingSizes.map((name, idx) => ({
                  name,
                  rank: (sizeAttr.values?.length || 0) + idx,
                })),
              },
            })
            for (const cv of (createdVals as any[]) || []) {
              sizeValueIds.push(cv.id)
            }
          } catch (createValErr: any) {
            console.warn("[WhatsAppManager] Warning adding size values to system attribute:", createValErr.message)
          }
        }

        attributes.push({
          id: sizeAttr.id,
          value_ids: sizeValueIds,
        })
      } else {
        attributes.push({
          title: "Size",
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          values: sizes,
        })
      }
    }

    // 2. Resolve Color Attribute
    if (colors.length > 0) {
      if (colorAttr) {
        const colorValueIds: string[] = []
        const missingColors: string[] = []

        for (const c of colors) {
          const val = colorAttr.values?.find(
            (v: any) => v.name?.toLowerCase() === c.toLowerCase()
          )
          if (val) {
            colorValueIds.push(val.id)
          } else {
            missingColors.push(c)
          }
        }

        if (missingColors.length > 0) {
          try {
            const { result: createdVals } = await createProductAttributeValuesWorkflow(this.container).run({
              input: {
                attribute_id: colorAttr.id,
                values: missingColors.map((name, idx) => ({
                  name,
                  rank: (colorAttr.values?.length || 0) + idx,
                })),
              },
            })
            for (const cv of (createdVals as any[]) || []) {
              colorValueIds.push(cv.id)
            }
          } catch (createValErr: any) {
            console.warn("[WhatsAppManager] Warning adding color values to system attribute:", createValErr.message)
          }
        }

        attributes.push({
          id: colorAttr.id,
          value_ids: colorValueIds,
        })
      } else {
        attributes.push({
          title: "Color",
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          values: colors,
        })
      }
    }

    // 3. Pricing calculations (strictly optional if missing)
    const mrp =
      product.mrp != null && !isNaN(product.mrp) && product.mrp > 0
        ? product.mrp
        : null
    const retailUnitPrice =
      product.suggested_price != null && !isNaN(product.suggested_price) && product.suggested_price > 0
        ? product.suggested_price
        : null
    const wholesaleUnitPrice =
      product.wholesale_price != null && !isNaN(product.wholesale_price) && product.wholesale_price > 0
        ? product.wholesale_price
        : null

    const retailPriceAmount = retailUnitPrice != null ? Math.round(retailUnitPrice * 100) : null
    const retailPrices =
      retailPriceAmount != null
        ? [
            {
              currency_code: currencyCode,
              amount: retailPriceAmount,
            },
          ]
        : []

    const skuBase =
      slugify(product.article_number || product.title)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10) || "PROD"

    const retailVariants: any[] = []

    // Build Retail Variants
    if (sizes.length > 0 && colors.length > 0) {
      for (const size of sizes) {
        for (const color of colors) {
          retailVariants.push({
            title: `${size} / ${color}`,
            sku: `${skuBase}-${slugify(size).toUpperCase()}-${slugify(color).toUpperCase().slice(0, 4)}`,
            options: {
              Size: size,
              Color: color,
            },
            prices: retailPrices,
            metadata: {
              variant_type: "retail",
              ...(mrp != null ? { mrp, unit_msrp: mrp } : {}),
              ...(retailUnitPrice != null ? { sale_price: retailUnitPrice } : {}),
            },
          })
        }
      }
    } else if (sizes.length > 0) {
      for (const size of sizes) {
        retailVariants.push({
          title: size,
          sku: `${skuBase}-${slugify(size).toUpperCase()}`,
          options: {
            Size: size,
          },
          prices: retailPrices,
          metadata: {
            variant_type: "retail",
            ...(mrp != null ? { mrp, unit_msrp: mrp } : {}),
            ...(retailUnitPrice != null ? { sale_price: retailUnitPrice } : {}),
          },
        })
      }
    } else if (colors.length > 0) {
      for (const color of colors) {
        retailVariants.push({
          title: color,
          sku: `${skuBase}-${slugify(color).toUpperCase().slice(0, 4)}`,
          options: {
            Color: color,
          },
          prices: retailPrices,
          metadata: {
            variant_type: "retail",
            ...(mrp != null ? { mrp, unit_msrp: mrp } : {}),
            ...(retailUnitPrice != null ? { sale_price: retailUnitPrice } : {}),
          },
        })
      }
    } else {
      retailVariants.push({
        title: "Default Retail",
        sku: `${skuBase}-RET-DEFAULT`,
        prices: retailPrices,
        metadata: {
          variant_type: "retail",
          ...(mrp != null ? { mrp, unit_msrp: mrp } : {}),
          ...(retailUnitPrice != null ? { sale_price: retailUnitPrice } : {}),
        },
      })
    }

    // 4. Build Wholesale Variants (Pack bundle of detected sizes)
    const wholesaleVariants: any[] = []
    const bundleSize = sizes.length > 0 ? sizes.length : 6
    const packDescription =
      sizes.length > 0
        ? `Pack of ${bundleSize} (Sizes: ${sizes.join(", ")})`
        : `Wholesale Pack of ${bundleSize}`

    const packBreakdown: Record<string, number> = {}
    if (sizes.length > 0) {
      for (const s of sizes) {
        packBreakdown[s] = 1
      }
    } else {
      packBreakdown["Standard"] = bundleSize
    }

    const wholesalePackPriceAmount =
      wholesaleUnitPrice != null ? Math.round(wholesaleUnitPrice * bundleSize * 100) : null
    const wholesalePrices =
      wholesalePackPriceAmount != null
        ? [
            {
              currency_code: currencyCode,
              amount: wholesalePackPriceAmount,
            },
          ]
        : []

    wholesaleVariants.push({
      title: `Wholesale ${packDescription}`,
      sku: `${skuBase}-WS-${bundleSize}PK`,
      pack_description: packDescription,
      bundle_size: bundleSize,
      pack_breakdown: packBreakdown,
      prices: wholesalePrices,
      metadata: {
        variant_type: "wholesale",
        bundle_size: bundleSize,
        pack_description: packDescription,
        pack_breakdown: packBreakdown,
        ...(mrp != null ? { mrp, unit_msrp: mrp } : {}),
        ...(wholesaleUnitPrice != null ? { wholesale_unit_price: wholesaleUnitPrice } : {}),
      },
    })

    const allVariants = [...retailVariants, ...wholesaleVariants]

    return {
      attributes,
      variants: allVariants,
      retailVariants,
      wholesaleVariants,
    }
  }

  private async sendHelpMessage(toPhone: string, isAdmin: boolean): Promise<void> {
    const lines = [
      `🤖 *WhatsApp Product Assistant*`,
      `Commands:`,
      `• *Upload Product*: Send 1-4 photos with an optional caption. Accompanying text with images is automatically included in product extraction.`,
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
      `\n💬 *AI Commerce Assistant*:`,
      `You can chat naturally anytime! Ask questions or tell me what to change on your active draft.`
    )

    lines.push(
      `\nDuring draft confirmation:`,
      `• *YES* to publish`,
      `• *PRICE <amount>* to set retail price`,
      `• *WHOLESALE <rate>* to set wholesale unit rate`,
      `• *MRP <amount>* to set MRP`,
      `• *ART <number>* to change article title`,
      `• *CATEGORY <cats>* to set multiple categories (multi-select)`,
      `• *CANCEL* to discard`
    )
    await this.client.sendMessage(toPhone, lines.join("\n"))
  }
}
