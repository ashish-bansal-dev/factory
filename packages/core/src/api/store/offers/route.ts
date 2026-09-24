import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  splitComputedOfferFields,
  wrapOffersWithCalculatedPrices,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "./helpers"
import { StoreGetOffersParamsType } from "./validators"
import { resolveChannel } from "../../utils/channel"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOffersParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity } =
    splitComputedOfferFields(req.queryConfig.fields)

  const effectiveChannel = resolveChannel(req)
  const filters: Record<string, unknown> = {
    ...(req.filterableFields as Record<string, unknown>),
  }
  delete filters.channel
  if (effectiveChannel) {
    filters.offer_type = effectiveChannel
  }

  // Row-Level Security: Resolve effective seller from query param or tenant headers
  let effectiveSellerId: string | undefined =
    (typeof filters.seller_id === "string" ? (filters.seller_id as string) : undefined) ||
    (typeof req.headers["x-seller-id"] === "string" ? (req.headers["x-seller-id"] as string) : undefined)

  if (!effectiveSellerId && typeof req.headers["x-tenant-handle"] === "string") {
    const tenantHandle = req.headers["x-tenant-handle"]
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id"],
      filters: { handle: tenantHandle },
    }).catch(() => ({ data: [] }))
    effectiveSellerId = (sellers?.[0] as { id?: string })?.id
    if (!effectiveSellerId) {
      return res.json({
        offers: [],
        count: 0,
        offset: req.queryConfig?.pagination?.skip ?? 0,
        limit: req.queryConfig?.pagination?.take ?? 0,
      })
    }
  }

  if (effectiveSellerId) {
    filters.seller_id = effectiveSellerId
  }

  const { data: offers, metadata } = await query.graph({
    entity: "offer",
    fields: fields,
    filters,
    pagination: req.queryConfig.pagination,
  })

  let validOffers = offers
  const productIds = Array.from(
    new Set(
      offers
        .map((o: { product_id?: string }) => o.product_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  if (productIds.length > 0) {
    const { data: productSellers } = await query.graph({
      entity: "product_seller",
      fields: ["product_id", "seller_id"],
      filters: { product_id: productIds },
    })

    if (productSellers.length > 0) {
      const allowedByProduct = new Map<string, Set<string>>()
      for (const ps of productSellers as {
        product_id: string
        seller_id: string
      }[]) {
        if (!allowedByProduct.has(ps.product_id)) {
          allowedByProduct.set(ps.product_id, new Set())
        }
        allowedByProduct.get(ps.product_id)!.add(ps.seller_id)
      }

      validOffers = offers.filter(
        (o: { product_id?: string; seller_id?: string }) => {
          if (o.product_id && allowedByProduct.has(o.product_id)) {
            return Boolean(
              o.seller_id && allowedByProduct.get(o.product_id)!.has(o.seller_id)
            )
          }
          return true
        }
      )
    }
  }

  if (withCalculatedPrice) {
    await wrapOffersWithCalculatedPrices(
      req,
      validOffers
    )
    await wrapOffersWithTaxPrices(req, validOffers)
  }

  if (withInventoryQuantity) {
    await wrapOffersWithInventoryQuantityForSalesChannel(req, validOffers)
  }

  const countDiff = offers.length - validOffers.length
  res.json({
    offers: validOffers,
    count: Math.max(0, (metadata?.count ?? validOffers.length) - countDiff),
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}
