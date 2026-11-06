export interface ExtractedProduct {
  title: string
  subtitle?: string
  description: string
  category_name?: string
  material?: string
  suggested_price: number | null
  currency_code: string
  options?: Array<{
    title: string
    values: string[]
  }>
  variants?: Array<{
    title: string
    price: number
    sku?: string
  }>
}

export type WhatsAppSessionStep =
  | "COLLECTING_IMAGES"
  | "AWAITING_PRICE"
  | "AWAITING_CONFIRMATION"

export interface ProductDraft {
  product: ExtractedProduct
  imageUrls: string[]
  createdAt: number
  targetSellerId: string
  targetSellerName?: string
  isAdmin: boolean
}

export interface WhatsAppSession {
  step: WhatsAppSessionStep
  phone: string
  pendingImages: Array<{
    mediaId: string
    mimeType?: string
  }>
  draft?: ProductDraft
  debounceTimer?: ReturnType<typeof setTimeout>
  lastUpdated: number
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
