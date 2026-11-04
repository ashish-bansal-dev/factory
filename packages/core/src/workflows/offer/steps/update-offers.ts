import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export type UpdateOffersStepInput = Array<{
  id: string
  sku?: string
  shipping_profile_id?: string
  offer_type?: "retail" | "wholesale"
  bundle_size?: number
  mrp?: number | null
  lead_time_days?: number | null
  manage_inventory?: boolean
  allow_backorder?: boolean
  leadtime_to_ship?: number | null
  condition_id?: string | null
  metadata?: Record<string, unknown> | null
}>

export const updateOffersStep = createStep(
  "update-offers",
  async (data: UpdateOffersStepInput, { container }) => {
    if (!data.length) {
      return new StepResponse([], [])
    }

    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)

    const ids = data.map((d) => d.id)
    const before = await service.listOffers({ id: ids })
    const beforeById = new Map(before.map((o) => [o.id, o]))

    const offers = await service.updateOffers(data)

    const compensation = data.map(({ id }) => {
      const prev = beforeById.get(id)
      return {
        id,
        sku: prev?.sku,
        shipping_profile_id: prev?.shipping_profile_id,
        offer_type: prev?.offer_type,
        bundle_size: prev?.bundle_size,
        mrp: prev?.mrp ?? null,
        lead_time_days: prev?.lead_time_days ?? null,
        manage_inventory: prev?.manage_inventory,
        allow_backorder: prev?.allow_backorder,
        leadtime_to_ship: prev?.leadtime_to_ship ?? null,
        condition_id: prev?.condition_id ?? null,
        metadata: prev?.metadata ?? null,
      }
    })


    return new StepResponse(offers, compensation)
  },
  async (compensation, { container }) => {
    if (!compensation?.length) {
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.updateOffers(compensation)
  }
)
