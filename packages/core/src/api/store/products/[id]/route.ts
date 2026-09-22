import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  enrichProductAttributes,
  wrapProductVariantsWithOfferPrice,
} from "../../../utils"
import { splitComputedVariantFields } from "../helpers"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const visibleIds = (req.filterableFields as { id?: unknown }).id
  if (Array.isArray(visibleIds) && !visibleIds.includes(req.params.id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  // `variants.calculated_price` / `variants.offer_id` are computed from the
  // cheapest offer post-query, not graph columns — strip them before the read.
  const { fields, withCalculatedPrice } = splitComputedVariantFields(
    req.queryConfig.fields
  )
  req.queryConfig.fields = fields

  // region_id / currency_code are consumed by setPricingContext only —
  // the Product entity has neither column, so passing them through
  // raises `Trying to query by not existing property Product.region_id`.
  const {
    region_id: _r,
    currency_code: _c,
    seller_id,
    ...productFilters
  } = (req.filterableFields ?? {}) as Record<string, unknown>

  // Row-Level Security: Resolve effective seller from query param or tenant headers
  let effectiveSellerId: string | undefined =
    (typeof seller_id === "string" ? seller_id : undefined) ||
    (typeof req.headers["x-seller-id"] === "string" ? req.headers["x-seller-id"] : undefined)

  if (!effectiveSellerId && typeof req.headers["x-tenant-handle"] === "string") {
    const tenantHandle = req.headers["x-tenant-handle"]
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id"],
      filters: { handle: tenantHandle },
    }).catch(() => ({ data: [] }))
    effectiveSellerId = (sellers?.[0] as { id?: string })?.id
    if (!effectiveSellerId) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${req.params.id} was not found`,
      )
    }
  }

  if (effectiveSellerId) {
    const sellerId = effectiveSellerId
    const [sellerLinksRes, offersRes] = await Promise.all([
      query.graph({
        entity: "product_seller",
        fields: ["product_id"],
        filters: { seller_id: sellerId, product_id: req.params.id },
      }).catch(() => ({ data: [] })),
      query.graph({
        entity: "offer",
        fields: ["product_id"],
        filters: { seller_id: sellerId, product_id: req.params.id },
      }).catch(() => ({ data: [] })),
    ])

    const hasAccess =
      (sellerLinksRes.data?.length ?? 0) > 0 || (offersRes.data?.length ?? 0) > 0

    if (!hasAccess) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product with id ${req.params.id} was not found`,
      )
    }
  }

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { ...productFilters, id: req.params.id },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  // Cross-tenant guard: central marketplace requests cannot access private store_only products
  if (!effectiveSellerId && product.metadata?.listing_scope === "store_only") {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${req.params.id} was not found`,
    )
  }

  await enrichProductAttributes(
    req.scope,
    [product] as unknown as Parameters<typeof enrichProductAttributes>[1]
  )

  if (withCalculatedPrice) {
    await wrapProductVariantsWithOfferPrice(
      req,
      [product] as unknown as Parameters<typeof wrapProductVariantsWithOfferPrice>[1]
    )
  }

  res.json({ product })
}
