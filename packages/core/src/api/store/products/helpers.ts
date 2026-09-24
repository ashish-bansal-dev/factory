/**
 * Splits the virtual offer-pricing fields (`variants.calculated_price[.*]`,
 * `variants.offer_id`) out of a store-product field set. They are computed
 * post-query from the cheapest offer, not graph columns, so passing them to
 * `query.graph` raises `Trying to query by not existing property`.
 */
const VIRTUAL_VARIANT_FIELDS = new Set([
  "variants.calculated_price",
  "variants.offer_id",
  "variants.bundle_size",
  "variants.pack_price",
  "variants.offer_type",
  "variants.mrp",
])

const isVirtualVariantField = (field: string): boolean => {
  return (
    VIRTUAL_VARIANT_FIELDS.has(field) ||
    field.startsWith("variants.calculated_price.") ||
    field.startsWith("variants.pack_price.")
  )
}

export const splitComputedVariantFields = (fields: string[]) => {
  const withCalculatedPrice = fields.some(isVirtualVariantField)
  const filteredFields = fields.filter((f) => !isVirtualVariantField(f))

  return { fields: filteredFields, withCalculatedPrice }
}
