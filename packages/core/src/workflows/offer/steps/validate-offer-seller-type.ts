import { Query } from "@medusajs/framework"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOfferDTO, SellerType } from "@mercurjs/types"

export interface ValidateOfferSellerTypeInput {
  offers: CreateOfferDTO[]
}

export const validateOfferSellerTypeStep = createStep(
  "validate-offer-seller-type",
  async (input: ValidateOfferSellerTypeInput, { container }) => {
    const wholesaleOffers = input.offers.filter(
      (offer) => offer.offer_type === "wholesale"
    )

    if (!wholesaleOffers.length) {
      return new StepResponse(void 0)
    }

    const sellerIds = Array.from(
      new Set(wholesaleOffers.map((o) => o.seller_id))
    )
    const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)

    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "type"],
      filters: { id: sellerIds },
    })

    const sellerTypeById = new Map<string, string | null | undefined>(
      sellers.map((s: { id: string; type?: string | null }) => [s.id, s.type])
    )

    for (const offer of wholesaleOffers) {
      const sellerType = sellerTypeById.get(offer.seller_id)
      if (sellerType === SellerType.RETAILER || sellerType === "retailer") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Retailers are not permitted to create wholesale offers. Seller ${offer.seller_id} has seller_type 'retailer'.`
        )
      }
    }

    return new StepResponse(void 0)
  }
)
