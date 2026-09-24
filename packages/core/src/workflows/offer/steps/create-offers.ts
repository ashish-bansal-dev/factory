import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOfferRowDTO, MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export type CreateOffersStepInput = CreateOfferRowDTO[]

export const createOffersStep = createStep(
  "create-offers",
  async (data: CreateOffersStepInput, { container }) => {
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    const normalized: CreateOfferRowDTO[] = data.map((offer) => ({
      ...offer,
      offer_type: offer.offer_type ?? "retail",
      bundle_size: offer.bundle_size ?? 1,
      mrp: offer.mrp ?? null,
      lead_time_days: offer.lead_time_days ?? null,
    }))
    const offers = await service.createOffers(normalized)
    return new StepResponse(
      offers,
      offers.map((o) => o.id)
    )
  },
  async (ids: string[] | undefined, { container }) => {
    if (!ids?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.deleteOffers(ids)
  }
)
