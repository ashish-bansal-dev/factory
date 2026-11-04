import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  enrichProductAttributes,
  listProducts,
  wrapProductVariantsWithOfferPrice,
} from "../../utils"
import { splitComputedVariantFields } from "./helpers"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  // `variants.calculated_price` / `variants.offer_id` are computed from the
  // cheapest offer post-query, not graph columns — strip them before the read.
  const { fields, withCalculatedPrice } = splitComputedVariantFields(
    req.queryConfig.fields
  )
  req.queryConfig.fields = fields

  // Pricing-context keys feed setPricingContext / the offer-price wrap, not
  // product columns: query.graph errors on region_id, and the index rejects
  // every non-indexed key (`Field country_code is not indexed`).
  const {
    region_id: _r,
    currency_code: _c,
    country_code: _cc,
    province: _p,
    cart_id: _cart,
    channel: _ch,
    offer_type: _ot,
    seller_id,
    brand_id,
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
      // Explicit tenant handle requested that does not exist in the database
      return res.json({
        products: [],
        count: 0,
        offset: req.queryConfig?.pagination?.skip ?? 0,
        limit: req.queryConfig?.pagination?.take ?? 0,
      })
    }
  }

  if (effectiveSellerId) {
    const sellerId = effectiveSellerId
    const [sellerLinksRes, offersRes] = await Promise.all([
      query.graph({
        entity: "product_seller",
        fields: ["product_id"],
        filters: { seller_id: sellerId },
      }).catch(() => ({ data: [] })),
      query.graph({
        entity: "offer",
        fields: ["product_id", "prices.id"],
        filters: { seller_id: sellerId },
      }).catch(() => ({ data: [] })),
    ])

    const sellerProductIds = new Set<string>()
    for (const item of (sellerLinksRes.data ?? []) as { product_id?: string }[]) {
      if (item.product_id) {
        sellerProductIds.add(item.product_id)
      }
    }
    for (const item of (offersRes.data ?? []) as {
      product_id?: string
      prices?: { id?: string }[]
    }[]) {
      if (item.product_id && item.prices && item.prices.length > 0) {
        sellerProductIds.add(item.product_id)
      }
    }

    if (sellerProductIds.size === 0) {
      return res.json({
        products: [],
        count: 0,
        offset: req.queryConfig.pagination?.skip ?? 0,
        limit: req.queryConfig.pagination?.take ?? 0,
      })
    }

    if (productFilters.id) {
      const existing = Array.isArray(productFilters.id) ? productFilters.id : [productFilters.id]
      productFilters.id = (existing as string[]).filter((id) => sellerProductIds.has(id))
      if ((productFilters.id as string[]).length === 0) {
        return res.json({
          products: [],
          count: 0,
          offset: req.queryConfig.pagination?.skip ?? 0,
          limit: req.queryConfig.pagination?.take ?? 0,
        })
      }
    } else {
      productFilters.id = Array.from(sellerProductIds)
    }
  }

  if (brand_id) {
    const { data: brands } = await query.graph({
      entity: "brand",
      fields: ["products.id"],
      filters: { id: brand_id as string },
    }).catch(() => ({ data: [] }))

    const brand = brands?.[0] as { products?: { id: string }[] } | undefined
    const brandProductIds = (brand?.products ?? []).map((p) => p.id).filter(Boolean)

    if (brandProductIds.length === 0) {
      return res.json({
        products: [],
        count: 0,
        offset: req.queryConfig.pagination?.skip ?? 0,
        limit: req.queryConfig.pagination?.take ?? 0,
      })
    }

    if (productFilters.id) {
      const existing = Array.isArray(productFilters.id) ? productFilters.id : [productFilters.id]
      const brandSet = new Set(brandProductIds)
      productFilters.id = (existing as string[]).filter((id) => brandSet.has(id))
      if ((productFilters.id as string[]).length === 0) {
        return res.json({
          products: [],
          count: 0,
          offset: req.queryConfig.pagination?.skip ?? 0,
          limit: req.queryConfig.pagination?.take ?? 0,
        })
      }
    } else {
      productFilters.id = brandProductIds
    }
  }

  const { products, count, estimate_count, offset, limit } = await listProducts(
    req.scope,
    {
      fields: req.queryConfig.fields,
      filters: productFilters,
      pagination: req.queryConfig.pagination,
      locale: req.locale,
      cache: { ttl: 300 },
    }
  )

  await enrichProductAttributes(
    req.scope,
    products as unknown as Parameters<typeof enrichProductAttributes>[1]
  )

  let finalProducts = products as unknown as Parameters<typeof wrapProductVariantsWithOfferPrice>[1]

  // Central marketplace hub: exclude store_only products when not querying a specific seller
  if (!effectiveSellerId) {
    finalProducts = finalProducts.filter(
      (p) => (p as { metadata?: Record<string, unknown> }).metadata?.listing_scope !== "store_only"
    )
  }

  if (withCalculatedPrice) {
    await wrapProductVariantsWithOfferPrice(req, finalProducts)
  }

  res.json({
    products: finalProducts,
    count: finalProducts.length !== products.length ? finalProducts.length : count,
    estimate_count,
    offset,
    limit,
  })
}
