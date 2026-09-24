import {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  splitComputedOfferFields,
  wrapOffersWithCalculatedPrices,
  wrapOffersWithInventoryQuantityForSalesChannel,
  wrapOffersWithTaxPrices,
} from "../helpers"
import { StoreGetOfferParamsType } from "../validators"

export const GET = async (
  req: MedusaStoreRequest<StoreGetOfferParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { fields, withCalculatedPrice, withInventoryQuantity } =
    splitComputedOfferFields(req.queryConfig.fields)

  const {
    data: [offer],
  } = await query.graph({
    entity: "offer",
    fields: fields,
    filters: { ...req.filterableFields, id: req.params.id },
  })

  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id ${req.params.id} was not found`
    )
  }

  if (offer.product_id && offer.seller_id) {
    const { data: productSellers } = await query.graph({
      entity: "product_seller",
      fields: ["seller_id"],
      filters: { product_id: offer.product_id },
    })

    if (
      productSellers.length > 0 &&
      !productSellers.some(
        (ps: { seller_id: string }) => ps.seller_id === offer.seller_id
      )
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offer with id ${req.params.id} was not found`
      )
    }
  }

  let effectiveSellerId: string | undefined =
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
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Offer with id ${req.params.id} was not found`
      )
    }
  }

  if (effectiveSellerId && offer.seller_id !== effectiveSellerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer with id ${req.params.id} was not found`
    )
  }

  const offers = [offer]
  if (withCalculatedPrice) {
    await wrapOffersWithCalculatedPrices(
      req,
      offers
    )
    await wrapOffersWithTaxPrices(req, offers)
  }

  if (withInventoryQuantity) {
    await wrapOffersWithInventoryQuantityForSalesChannel(req, offers)
  }

  res.json({ offer })
}
