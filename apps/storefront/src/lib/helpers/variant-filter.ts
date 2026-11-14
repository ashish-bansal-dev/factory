import { HttpTypes } from "@medusajs/types"

/**
 * Checks whether a variant is a single-piece retail variant.
 * Excludes variants where variant.metadata?.variant_type === "wholesale" or bundle_size > 1.
 */
export const isRetailVariant = (variant: any): boolean => {
  if (!variant) return false
  if (variant.metadata?.variant_type === "wholesale") return false
  const bundleSize =
    Number(variant.metadata?.bundle_size) ||
    Number(variant.bundle_size) ||
    Number(variant.calculated_price?.bundle_size) ||
    1
  return bundleSize <= 1
}

/**
 * Filters a product's variants to retail only, and strips option values
 * that only exist on excluded wholesale variants.
 */
export const filterRetailProduct = (
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct => {
  if (!product || !product.variants) return product

  const retailVariants = product.variants.filter(isRetailVariant)

  const allowedValuesByOptionTitle: Record<string, Set<string>> = {}
  for (const v of retailVariants) {
    for (const opt of v.options || []) {
      const title = opt.option?.title?.toLowerCase()
      if (title && opt.value) {
        if (!allowedValuesByOptionTitle[title]) {
          allowedValuesByOptionTitle[title] = new Set()
        }
        allowedValuesByOptionTitle[title].add(opt.value)
      }
    }
  }

  const filteredOptions = (product.options || [])
    .map((opt) => {
      const title = opt.title?.toLowerCase()
      const allowed = title ? allowedValuesByOptionTitle[title] : null
      if (!allowed) return opt
      return {
        ...opt,
        values: (opt.values || []).filter((val) => allowed.has(val.value)),
      }
    })
    .filter((opt) => (opt.values?.length ?? 0) > 0)

  return {
    ...product,
    variants: retailVariants,
    options: filteredOptions,
  }
}

/**
 * Returns single-item MRP for a variant:
 * variant.metadata?.mrp || variant.mrp
 */
export const getVariantMrp = (variant: any): number | null => {
  if (!variant) return null
  const mrp =
    variant.metadata?.mrp != null
      ? Number(variant.metadata.mrp)
      : variant.mrp != null
      ? Number(variant.mrp)
      : null
  return mrp != null && !isNaN(mrp) && mrp > 0 ? mrp : null
}
