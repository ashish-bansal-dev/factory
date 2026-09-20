import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"
import OfferModuleService from "../../../modules/offer/service"

export interface CleanupIneligibleProductOffersStepInput {
  productId: string
}

export const cleanupIneligibleProductOffersStepId =
  "cleanup-ineligible-product-offers"

export const cleanupIneligibleProductOffersStep = createStep(
  cleanupIneligibleProductOffersStepId,
  async (input: CleanupIneligibleProductOffersStepInput, { container }) => {
    if (!input.productId) {
      return new StepResponse([], [])
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // Check if product is restricted to specific sellers
    const { data: links } = await query.graph({
      entity: "product_seller",
      fields: ["seller_id"],
      filters: { product_id: input.productId },
    })

    // If empty, the product is global — all sellers are eligible, so do not delete any offers
    if (!links?.length) {
      return new StepResponse([], [])
    }

    const allowedSellerIds = new Set(
      links.map((l: { seller_id: string }) => l.seller_id)
    )

    // Query active offers for this product
    const { data: offers } = await query.graph({
      entity: "offer",
      fields: ["id", "seller_id"],
      filters: { product_id: input.productId },
    })

    const offerIdsToDelete = offers
      .filter(
        (o: { id: string; seller_id: string }) =>
          !allowedSellerIds.has(o.seller_id)
      )
      .map((o: { id: string }) => o.id)

    if (!offerIdsToDelete.length) {
      return new StepResponse([], [])
    }

    const offerModule =
      container.resolve<OfferModuleService>(MercurModules.OFFER)
    await offerModule.softDeleteOffers(offerIdsToDelete)

    return new StepResponse(offerIdsToDelete, offerIdsToDelete)
  },
  async (offerIds, { container }) => {
    if (!offerIds?.length) {
      return
    }
    const offerModule =
      container.resolve<OfferModuleService>(MercurModules.OFFER)
    await offerModule.restoreOffers(offerIds)
  }
)
