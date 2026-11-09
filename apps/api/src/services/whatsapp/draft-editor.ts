import { ExtractedProduct } from "./types"

export interface ConversationContext {
  isAdmin: boolean
  userName?: string
  sellerName?: string
  sellerId?: string
  availableSellers?: Array<{ id: string; name: string; handle: string }>
  hasDraft: boolean
  draftProduct?: ExtractedProduct
}

export interface AssistantResponse {
  action:
    | "CHAT"
    | "LIST_PRODUCTS"
    | "LIST_SELLERS"
    | "SWITCH_VENDOR"
    | "CLEAR_VENDOR"
    | "ASSIGN_SELLER"
    | "UPDATE_DRAFT"
    | "PUBLISH_DRAFT"
    | "CANCEL_DRAFT"
    | "HELP"
  sellerQuery?: string
  updatedProduct?: ExtractedProduct
  replyMessage: string
}

export interface DraftEditResult {
  action: "UPDATE" | "PUBLISH" | "CANCEL" | "ASSIGN_SELLER" | "CLARIFY"
  updatedProduct?: ExtractedProduct
  sellerQuery?: string
  message: string
}

export class DraftEditorService {
  private apiKey?: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY
    this.model = model || process.env.TEXT_MODEL || "gemma-4-31b-it"
  }

  /**
   * General conversation and intent processor powered by Gemma 4 31B.
   */
  async processConversation(
    context: ConversationContext,
    userMessage: string
  ): Promise<AssistantResponse> {
    const draftTextDossier =
      context.hasDraft && context.draftProduct
        ? `- Active Product Dossier (Step 2 Text Session - Extracted from Image in Step 1):
  * Title: "${context.draftProduct.title}"
  * Subtitle: "${context.draftProduct.subtitle || "N/A"}"
  * Visual & Detailed Description: "${context.draftProduct.description}"
  * Category: "${context.draftProduct.category_name || "General"}"
  * Material/Fabric: "${context.draftProduct.material || "Unspecified"}"
  * Current Price: ${context.draftProduct.suggested_price != null ? `₹${context.draftProduct.suggested_price}` : "Not set"} (INR)
  * Variants: ${context.draftProduct.variants?.map((v) => `${v.title}: ₹${v.price}`).join(", ") || "Default"}
Note: The image was processed in Step 1. Use the above visual and product description as your authoritative text reference for answering any user questions about the product's appearance, fabric, or features.`
        : "- Active Product Draft: None"

    const prompt = `You are the AI WhatsApp Commerce Assistant **Carbon** for FactoryTribe marketplace.
You communicate warmly, concisely, and professionally via WhatsApp. Format text with standard WhatsApp conventions (*bold*, bullet points, emojis). All pricing must be in INR (₹).

Current User Context:
- Role: ${context.isAdmin ? "Marketplace Admin (can manage and create products for all vendors)" : `Vendor (${context.sellerName || "Store Owner"})`}
- Active Vendor Context: ${context.sellerName ? `${context.sellerName} (ID: ${context.sellerId})` : context.isAdmin ? "Marketplace Admin (Global)" : "Own store"}
${draftTextDossier}
- Registered Vendors: ${context.availableSellers?.length ? JSON.stringify(context.availableSellers) : "None"}

User Message:
"${userMessage}"

Determine the user's intent and output a strict JSON object with:
1. "action": One of:
   - "CHAT": Conversational inquiry, greeting, question about the marketplace, advice, or general conversation.
   - "LIST_PRODUCTS": User wants to browse, search, or inspect inventory/products.
   - "LIST_SELLERS": Admin wants to see all registered vendors/sellers.
   - "SWITCH_VENDOR": Admin wants to switch active vendor context to upload/manage on their behalf.
   - "CLEAR_VENDOR": Admin wants to clear active vendor context and return to general admin.
   - "ASSIGN_SELLER": Admin wants to assign or change the vendor of the current in-progress product draft.
   - "UPDATE_DRAFT": User wants to change price (in INR ₹), title, description, or attributes of the active product draft.
   - "PUBLISH_DRAFT": User wants to publish/confirm the active product draft (e.g. "yes", "publish it", "looks good").
   - "CANCEL_DRAFT": User wants to discard/cancel the active draft.
   - "HELP": User asks for help, menu, commands, or instructions.

2. "sellerQuery": If the action is SWITCH_VENDOR or ASSIGN_SELLER, extract the target seller's name, handle, or ID. Otherwise null.

3. "updatedProduct": If UPDATE_DRAFT or ASSIGN_SELLER, return the product object with all requested edits applied (ensure suggested_price is in INR and a valid number or null, currency_code: "inr"). If no product edits, return the current product. Otherwise null.

4. "replyMessage": A helpful, friendly 1-3 sentence WhatsApp response directly answering the user or confirming what was done.

Output ONLY valid JSON matching this schema:
{
  "action": "CHAT" | "LIST_PRODUCTS" | "LIST_SELLERS" | "SWITCH_VENDOR" | "CLEAR_VENDOR" | "ASSIGN_SELLER" | "UPDATE_DRAFT" | "PUBLISH_DRAFT" | "CANCEL_DRAFT" | "HELP",
  "sellerQuery": string or null,
  "updatedProduct": {
    "title": string,
    "subtitle": string,
    "description": string,
    "category_name": string,
    "material": string,
    "suggested_price": number | null,
    "currency_code": "inr",
    "options": [ { "title": string, "values": string[] } ],
    "variants": [ { "title": string, "price": number } ]
  } or null,
  "replyMessage": string
}`

    if (!this.apiKey || this.apiKey.startsWith("test") || process.env.NODE_ENV === "test") {
      return this.fallbackConversation(context, userMessage)
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.warn(`[DraftEditorService] Model call (${this.model}) failed: ${errText}`)
        return this.fallbackConversation(context, userMessage)
      }

      const data = await res.json()
      const parts = data.candidates?.[0]?.content?.parts || []

      // Filter out thinking tokens from models like Gemma 4 31B
      const textParts = parts
        .filter((p: any) => !p.thought)
        .map((p: any) => p.text)
        .join("")
        .trim()

      const jsonMatch = textParts.match(/\{[\s\S]*\}/)
      const rawText = jsonMatch
        ? jsonMatch[0]
        : textParts.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim() || "{}"

      const parsed = JSON.parse(rawText) as AssistantResponse

      return {
        action: parsed.action || "CHAT",
        sellerQuery: parsed.sellerQuery || undefined,
        updatedProduct: parsed.updatedProduct || context.draftProduct,
        replyMessage: parsed.replyMessage || "I'm here to help you manage your store and products!",
      }
    } catch (err: any) {
      console.error("[DraftEditorService] Error processing conversation:", err)
      return this.fallbackConversation(context, userMessage)
    }
  }

  /**
   * Compatibility wrapper for draft-specific updates.
   */
  async processDraftResponse(
    currentProduct: ExtractedProduct,
    userMessage: string,
    isAdmin?: boolean,
    availableSellers?: Array<{ id: string; name: string; handle: string }>
  ): Promise<DraftEditResult> {
    const res = await this.processConversation(
      {
        isAdmin: Boolean(isAdmin),
        hasDraft: true,
        draftProduct: currentProduct,
        availableSellers,
      },
      userMessage
    )

    let action: "UPDATE" | "PUBLISH" | "CANCEL" | "ASSIGN_SELLER" | "CLARIFY" = "CLARIFY"
    if (res.action === "PUBLISH_DRAFT") action = "PUBLISH"
    else if (res.action === "CANCEL_DRAFT") action = "CANCEL"
    else if (res.action === "ASSIGN_SELLER") action = "ASSIGN_SELLER"
    else if (res.action === "UPDATE_DRAFT") action = "UPDATE"
    else if (res.action === "CHAT" || res.action === "HELP") action = "CLARIFY"

    return {
      action,
      updatedProduct: res.updatedProduct || currentProduct,
      sellerQuery: res.sellerQuery,
      message: res.replyMessage,
    }
  }

  /**
   * Compatibility alias for draft fallback parser.
   */
  fallbackParse(currentProduct: ExtractedProduct, userMessage: string): DraftEditResult {
    const res = this.fallbackConversation(
      {
        isAdmin: false,
        hasDraft: true,
        draftProduct: currentProduct,
      },
      userMessage
    )

    let action: "UPDATE" | "PUBLISH" | "CANCEL" | "ASSIGN_SELLER" | "CLARIFY" = "CLARIFY"
    if (res.action === "PUBLISH_DRAFT") action = "PUBLISH"
    else if (res.action === "CANCEL_DRAFT") action = "CANCEL"
    else if (res.action === "ASSIGN_SELLER") action = "ASSIGN_SELLER"
    else if (res.action === "UPDATE_DRAFT") action = "UPDATE"

    return {
      action,
      updatedProduct: res.updatedProduct || currentProduct,
      sellerQuery: res.sellerQuery,
      message: res.replyMessage,
    }
  }

  /**
   * Deterministic fallback parser when network or AI call is unavailable.
   */
  private fallbackConversation(context: ConversationContext, userMessage: string): AssistantResponse {
    const text = userMessage.trim()
    const textUpper = text.toUpperCase()

    // 1. HELP / MENU
    if (textUpper === "HELP" || textUpper === "MENU") {
      return {
        action: "HELP",
        replyMessage: "Here are the available commands and features.",
      }
    }

    // 2. SELLERS (Admin only)
    if (
      context.isAdmin &&
      (textUpper === "SELLERS" ||
        textUpper === "LIST SELLERS" ||
        textUpper === "VENDORS" ||
        textUpper === "LIST VENDORS" ||
        /^(?:SHOW|VIEW|GET)\s+(?:ALL\s+)?(?:SELLERS|VENDORS)/i.test(text))
    ) {
      return {
        action: "LIST_SELLERS",
        replyMessage: "Fetching all registered marketplace vendors...",
      }
    }

    // 3. SWITCH VENDOR (Admin only)
    const switchMatch = text.match(/^(?:SWITCH\s+)?(?:VENDOR|SELLER)\s+(.+)/i)
    if (context.isAdmin && switchMatch) {
      return {
        action: "SWITCH_VENDOR",
        sellerQuery: switchMatch[1].trim(),
        replyMessage: `Switching active vendor to ${switchMatch[1].trim()}...`,
      }
    }

    // 4. CLEAR VENDOR (Admin only)
    if (context.isAdmin && (textUpper === "CLEAR VENDOR" || textUpper === "EXIT VENDOR" || textUpper === "EXIT")) {
      return {
        action: "CLEAR_VENDOR",
        replyMessage: "Active vendor context cleared.",
      }
    }

    // 5. LIST PRODUCTS
    if (
      textUpper === "LIST PRODUCTS" ||
      textUpper === "LIST PRODUCT" ||
      textUpper === "PRODUCTS" ||
      textUpper === "PRODUCT" ||
      textUpper === "NEXT" ||
      /^PRODUCT\s+\d+$/i.test(text)
    ) {
      return {
        action: "LIST_PRODUCTS",
        replyMessage: "Fetching products from your catalog...",
      }
    }

    // 6. Active Draft Actions
    if (context.hasDraft && context.draftProduct) {
      if (/\b(YES|CONFIRM|PUBLISH|LOOKS GOOD|APPROVE)\b/i.test(textUpper)) {
        return {
          action: "PUBLISH_DRAFT",
          updatedProduct: context.draftProduct,
          replyMessage: "Publishing product to your store...",
        }
      }
      if (/\b(CANCEL|DISCARD|ABORT|DELETE)\b/i.test(textUpper)) {
        return {
          action: "CANCEL_DRAFT",
          replyMessage: "Product draft cancelled and discarded.",
        }
      }

      // Check seller assignment for admin during draft
      const assignMatch =
        text.match(/^(?:ASSIGN\s+(?:TO\s+)?)?(?:VENDOR|SELLER|FOR)\s+(.+)/i) ||
        text.match(/^(?:MAKE\s+FOR|CREATE\s+FOR)\s+(.+)/i)
      if (context.isAdmin && assignMatch) {
        return {
          action: "ASSIGN_SELLER",
          sellerQuery: assignMatch[1].trim(),
          updatedProduct: context.draftProduct,
          replyMessage: `Assigning product to vendor ${assignMatch[1].trim()}...`,
        }
      }

      // Price update
      const priceMatch =
        text.match(/(?:PRICE|COST|FOR)\s*[₹\$]?([0-9]+(?:\.[0-9]{1,2})?)/i) ||
        text.match(/^[₹\$]?([0-9]+(?:\.[0-9]{1,2})?)$/)
      if (priceMatch) {
        const num = parseFloat(priceMatch[1])
        if (!isNaN(num) && num > 0) {
          const updated = {
            ...context.draftProduct,
            suggested_price: num,
            currency_code: "inr",
            variants:
              context.draftProduct.variants?.map((v) => ({ ...v, price: num })) || [
                { title: "Default", price: num },
              ],
          }
          return {
            action: "UPDATE_DRAFT",
            updatedProduct: updated,
            replyMessage: `Updated price to ₹${num}. Reply YES to publish!`,
          }
        }
      }

      // Title update
      const titleMatch = text.match(/^(?:TITLE|RENAME TO|SET TITLE TO)\s*(.+)/i)
      if (titleMatch) {
        const newTitle = titleMatch[1].trim()
        const updated = { ...context.draftProduct, title: newTitle }
        return {
          action: "UPDATE_DRAFT",
          updatedProduct: updated,
          replyMessage: `Updated title to "${newTitle}". Reply YES to publish!`,
        }
      }
    }

    // 7. Conversational Greeting or Inquiries
    if (/\b(HI|HELLO|HEY|NAMASTE|GREETINGS)\b/i.test(textUpper)) {
      return {
        action: "CHAT",
        replyMessage: `👋 Hello! I am Carbon.\n\n• Send 1-4 product photos with an optional caption to create a new product draft.\n• Reply *LIST PRODUCTS* to view inventory.\n${context.isAdmin ? "• Reply *SELLERS* to view all registered vendors.\n• Reply *VENDOR <name>* to manage or upload for a specific seller.\n" : ""}• Reply *HELP* for full command list.`,
      }
    }

    return {
      action: "CHAT",
      replyMessage:
        "👋 Welcome! Send 1 or more product photos with an optional caption to create a product draft, or type *LIST PRODUCTS* to inspect inventory. Type *HELP* for all commands.",
    }
  }
}
