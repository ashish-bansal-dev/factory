import { convertToLocale } from "./money"

export interface VolumeTier {
  minQuantity: number
  maxQuantity: number | null
  packPrice: number
  unitPrice?: number
  discountPercentage: number
  rangeLabel: string
  displayPrice: string
}

export interface VariantAvailability {
  status: "in_stock" | "backorder" | "out_of_stock"
  badgeText: string
  leadTimeDays: number
  inventoryQuantity: number
  allowBackorder: boolean
}

/**
 * Safely parse pack breakdown from variant metadata or attributes.
 * Example inputs: { S: 1, M: 2, L: 2, XL: 1 } or '{"S": 1, "M": 2, "L": 2, "XL": 1}' or { M: 6 }
 */
export function parsePackBreakdown(
  raw: any
): Record<string, number> | null {
  if (!raw) return null

  let data = raw
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw)
    } catch {
      return null
    }
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null
  }

  const result: Record<string, number> = {}
  let hasValid = false

  for (const [key, val] of Object.entries(data)) {
    const num = Number(val)
    if (!isNaN(num) && num > 0) {
      result[key] = num
      hasValid = true
    }
  }

  return hasValid ? result : null
}

const APPAREL_SIZE_ORDER = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
]

/**
 * Format a parsed pack breakdown into an editorial curve string.
 * e.g. "Curve: 1S • 2M • 2L • 1XL" or "Solid: 6M"
 */
export function formatPackBreakdown(
  breakdown: Record<string, number> | null,
  options?: { prefix?: boolean }
): string | null {
  if (!breakdown) return null

  const keys = Object.keys(breakdown)
  if (keys.length === 0) return null

  // Sort keys by known apparel size order or natural alphanumeric
  keys.sort((a, b) => {
    const idxA = APPAREL_SIZE_ORDER.indexOf(a.toUpperCase())
    const idxB = APPAREL_SIZE_ORDER.indexOf(b.toUpperCase())
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  const parts = keys.map((size) => `${breakdown[size]}${size}`)
  const joined = parts.join(" • ")

  if (options?.prefix === false) {
    return joined
  }

  if (keys.length > 1) {
    return `Curve: ${joined}`
  }

  return `Solid: ${joined}`
}

/**
 * Determine if a variant is wholesale-only.
 * Only variants where variant.metadata?.variant_type === "wholesale" or bundle_size > 1.
 */
export function isWholesaleVariant(variant: any): boolean {
  if (!variant) return false
  const isWholesaleType = variant.metadata?.variant_type === "wholesale"
  const bundleSize =
    Number(variant.metadata?.bundle_size) ||
    Number(variant.bundle_size) ||
    Number(variant.calculated_price?.bundle_size) ||
    1
  return isWholesaleType || bundleSize > 1
}

/**
 * Extract human-readable pack description.
 * Defaults to metadata.pack_description, falling back to pack_name if needed.
 */
export function getPackDescription(variant: any): string | null {
  if (!variant) return null
  return (
    variant.metadata?.pack_description ||
    variant.pack_description ||
    variant.metadata?.pack_name ||
    variant.pack_name ||
    null
  )
}

/**
 * Get unit MRP for a variant (e.g. 100).
 * Defaults to variant.metadata?.mrp || variant.mrp || variant.calculated_price?.mrp || 100.
 */
export function getUnitMrp(variant: any): number {
  if (!variant) return 100
  const mrp = Number(
    variant.metadata?.mrp ??
    variant.mrp ??
    variant.calculated_price?.mrp
  )
  return !isNaN(mrp) && mrp > 0 ? mrp : 100
}

/**
 * Calculate Total Pack MSRP dynamically:
 * Pack MSRP = unit MRP * bundle_size
 */
export function calculatePackMsrp(variant: any, bundleSize?: number): number {
  const bSize = bundleSize ?? calculateBundleSize(variant)
  return getUnitMrp(variant) * bSize
}

/**
 * Determine bundle size (units/pcs per pack) from variant properties and breakdown.
 */
export function calculateBundleSize(
  variant: any,
  breakdown?: Record<string, number> | null
): number {
  if (!variant) return 1

  const directBundle =
    Number(variant.bundle_size) ||
    Number(variant.metadata?.bundle_size) ||
    Number(variant.calculated_price?.bundle_size)

  if (directBundle && directBundle > 0) {
    return directBundle
  }

  if (breakdown) {
    const sum = Object.values(breakdown).reduce((acc, qty) => acc + (Number(qty) || 0), 0)
    if (sum > 0) return sum
  }

  return 1
}

/**
 * Calculate retail margin percentage:
 * Margin % = ((Pack MSRP - Pack Price) / Pack MSRP) * 100
 */
export function calculateRetailMargin(
  packMsrp: number | null | undefined,
  packPrice: number | null | undefined
): number {
  if (!packMsrp || !packPrice || packMsrp <= packPrice || packMsrp <= 0) {
    return 0
  }
  return Math.round(((packMsrp - packPrice) / packMsrp) * 100)
}

/**
 * Evaluate variant inventory and backorder availability:
 * - If inventory_quantity > 0: "In Stock (Ships in 24-48h)"
 * - If inventory_quantity <= 0 and allow_backorder: "Backorder Available (Ships in {lead_time_days || 14} days)"
 * - If inventory_quantity <= 0 and not allow_backorder: "Out of Stock — Request Quote"
 */
export function getVariantAvailability(variant: any): VariantAvailability {
  const inventoryQuantity =
    typeof variant?.inventory_quantity === "number"
      ? variant.inventory_quantity
      : variant?.manage_inventory === false
      ? 999
      : 0

  const allowBackorder = Boolean(
    variant?.allow_backorder ||
      variant?.metadata?.allow_backorder ||
      variant?.offer?.allow_backorder
  )

  const leadTimeDays =
    Number(variant?.metadata?.lead_time_days) ||
    Number(variant?.lead_time_days) ||
    Number(variant?.offer?.lead_time_days) ||
    14

  if (inventoryQuantity > 0) {
    return {
      status: "in_stock",
      badgeText: "In Stock (Ships in 24-48h)",
      leadTimeDays,
      inventoryQuantity,
      allowBackorder,
    }
  }

  if (allowBackorder) {
    return {
      status: "backorder",
      badgeText: `Backorder Available (Ships in ${leadTimeDays} days)`,
      leadTimeDays,
      inventoryQuantity,
      allowBackorder,
    }
  }

  return {
    status: "out_of_stock",
    badgeText: "Out of Stock — Request Quote",
    leadTimeDays,
    inventoryQuantity,
    allowBackorder: false,
  }
}

/**
 * Extract and normalize volume discount price breaks from variant/offer metadata or price rules.
 * Supports metadata.volume_tiers, metadata.tiered_pricing, metadata.quantity_breaks,
 * and variant.prices with min_quantity breaks.
 */
export function getVolumeTiers(
  variant: any,
  product: any,
  basePackPrice: number,
  currencyCode: string = "INR"
): VolumeTier[] {
  let rawTiers: any =
    variant?.metadata?.volume_tiers ||
    variant?.metadata?.tiered_pricing ||
    variant?.metadata?.quantity_breaks ||
    variant?.metadata?.price_tiers ||
    variant?.offer?.metadata?.volume_tiers ||
    variant?.offer?.metadata?.tiered_pricing ||
    product?.metadata?.volume_tiers ||
    product?.metadata?.tiered_pricing

  if (typeof rawTiers === "string") {
    try {
      rawTiers = JSON.parse(rawTiers)
    } catch {
      rawTiers = null
    }
  }

  // 1. If explicit array in metadata exists
  if (Array.isArray(rawTiers) && rawTiers.length > 0) {
    return rawTiers.map((t: any, index: number, arr: any[]) => {
      const minQty = Number(t.min_quantity || t.min_packs || t.quantity || t.min_qty || 1)
      const nextTier = arr[index + 1]
      const nextMin = nextTier
        ? Number(nextTier.min_quantity || nextTier.min_packs || nextTier.quantity || nextTier.min_qty)
        : null
      const maxQty =
        t.max_quantity != null
          ? Number(t.max_quantity)
          : t.max_packs != null
          ? Number(t.max_packs)
          : nextMin
          ? nextMin - 1
          : null

      const packPrice =
        Number(t.pack_price || t.price || t.amount) ||
        (t.discount_percentage
          ? Math.round(basePackPrice * (1 - Number(t.discount_percentage) / 100))
          : basePackPrice)

      const discountPercentage =
        t.discount_percentage != null
          ? Number(t.discount_percentage)
          : basePackPrice > packPrice
          ? Math.round(((basePackPrice - packPrice) / basePackPrice) * 100)
          : 0

      const rangeLabel =
        maxQty && maxQty > minQty
          ? `${minQty}–${maxQty} packs`
          : maxQty === minQty
          ? `${minQty} pack`
          : `${minQty}+ packs`

      const formattedPrice = convertToLocale({
        amount: packPrice,
        currency_code: currencyCode,
      })

      return {
        minQuantity: minQty,
        maxQuantity: maxQty,
        packPrice,
        discountPercentage,
        rangeLabel,
        displayPrice: `${formattedPrice}/pk`,
      }
    })
  }

  // 2. Check variant.prices for min_quantity breaks
  const prices: any[] = variant?.prices || []
  const matchingPrices = prices
    .filter(
      (p) =>
        p.currency_code?.toLowerCase() === currencyCode.toLowerCase() &&
        (p.min_quantity != null || p.rules?.some((r: any) => r.attribute === "min_quantity"))
    )
    .sort((a, b) => {
      const minA = a.min_quantity ?? Number(a.rules?.find((r: any) => r.attribute === "min_quantity")?.value ?? 1)
      const minB = b.min_quantity ?? Number(b.rules?.find((r: any) => r.attribute === "min_quantity")?.value ?? 1)
      return minA - minB
    })

  if (matchingPrices.length >= 2) {
    const baseAmount = matchingPrices[0].amount
    return matchingPrices.map((p, index) => {
      const minQty = p.min_quantity ?? Number(p.rules?.find((r: any) => r.attribute === "min_quantity")?.value ?? 1)
      const next = matchingPrices[index + 1]
      const nextMin = next
        ? next.min_quantity ?? Number(next.rules?.find((r: any) => r.attribute === "min_quantity")?.value ?? 0)
        : null
      const maxQty = p.max_quantity != null ? p.max_quantity : nextMin ? nextMin - 1 : null
      const packPrice = p.amount
      const discountPercentage =
        baseAmount > packPrice
          ? Math.round(((baseAmount - packPrice) / baseAmount) * 100)
          : 0

      const rangeLabel =
        maxQty && maxQty > minQty
          ? `${minQty}–${maxQty} packs`
          : maxQty === minQty
          ? `${minQty} pack`
          : `${minQty}+ packs`

      const formattedPrice = convertToLocale({
        amount: packPrice,
        currency_code: currencyCode,
      })

      return {
        minQuantity: minQty,
        maxQuantity: maxQty,
        packPrice,
        discountPercentage,
        rangeLabel,
        displayPrice: `${formattedPrice}/pk`,
      }
    })
  }

  return []
}
