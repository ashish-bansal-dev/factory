export interface WholesalePackDetails {
  bundle_size: number
  pack_description: string
  pack_breakdown?: Record<string, number>
  pack_price: number
  unit_price: number
}

export interface ExtractedProduct {
  article_number?: string
  title: string
  subtitle?: string
  description: string
  category_name?: string
  category_names?: string[]
  category_id?: string
  category_ids?: string[]
  brand?: string
  brand_id?: string
  sizes?: string[]
  colors?: string[]
  material?: string
  mrp?: number | null
  suggested_price?: number | null
  wholesale_price?: number | null
  wholesale_pack?: WholesalePackDetails
  currency_code: string
  options?: Array<{
    title: string
    values: string[]
  }>
  variants?: Array<{
    title: string
    price?: number
    sku?: string
    options?: Record<string, string>
    prices?: Array<{
      currency_code?: string
      amount?: number
    }>
    metadata?: Record<string, any>
  }>
  retail_variants?: Array<{
    title?: string
    sku?: string
    mrp?: number
    unit_msrp?: number
    price?: number
    options?: Record<string, string>
    prices?: Array<{
      currency_code?: string
      amount?: number
    }>
    metadata?: Record<string, any>
  }>
  wholesale_variants?: Array<{
    title?: string
    sku?: string
    pack_description?: string
    bundle_size: number
    pack_breakdown?: Record<string, number>
    mrp?: number
    unit_msrp?: number
    price?: number
    prices?: Array<{
      currency_code?: string
      amount?: number
    }>
    metadata?: Record<string, any>
  }>
}

export type WhatsAppSessionStep =
  | "COLLECTING_IMAGES"
  | "AWAITING_PRICE"
  | "AWAITING_CONFIRMATION"

export interface ConversationMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export interface ProductDraft {
  product: ExtractedProduct
  imageUrls: string[]
  createdAt: number
  targetSellerId: string
  targetSellerName?: string
  isAdmin: boolean
  rawCaptionsAndMessages?: string[]
}

export interface WhatsAppSession {
  step: WhatsAppSessionStep
  phone: string
  pendingImages: Array<{
    mediaId: string
    mimeType?: string
  }>
  pendingTexts: string[]
  captions: string[]
  draft?: ProductDraft
  conversationHistory: ConversationMessage[]
  debounceTimer?: ReturnType<typeof setTimeout>
  lastUpdated: number
  mode?: "SINGLE" | "BULK"
  targetSellerId?: string
  targetSellerName?: string
}

export interface AdminVendorContext {
  sellerId: string
  sellerName: string
  updatedAt: number
}

export interface WhatsAppWebhookBody {
  object: string
  entry?: Array<{
    id: string
    changes?: Array<{
      value?: {
        messaging_product: string
        metadata?: {
          display_phone_number?: string
          phone_number_id?: string
        }
        contacts?: Array<{
          profile?: {
            name?: string
          }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: "text" | "image" | string
          text?: {
            body: string
          }
          image?: {
            id: string
            mime_type?: string
            sha256?: string
            caption?: string
          }
        }>
      }
      field: string
    }>
  }>
}
