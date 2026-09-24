import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
  promiseAll,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  prepareOfferInventoryInput,
  requiredOfferFieldsForInventoryConfirmation,
} from "../../offer/utils"

addToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const items = input.items ?? []
  if (!items.length) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY)

  const offerIds = Array.from(
    new Set(
      items
        .map((i) => i.offer_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  )

  if (!offerIds.length) {
    return
  }

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: [
      ...requiredOfferFieldsForInventoryConfirmation,
      "offer_type",
      "bundle_size",
    ],
    filters: { id: offerIds },
  })

  const foundIds = new Set(offers.map((o: { id: string }) => o.id))
  const missing = offerIds.find((id) => !foundIds.has(id))
  if (missing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${missing} not found`,
    )
  }

  const offerMap = new Map(
    (
      offers as Array<{
        id: string
        offer_type?: string
        bundle_size?: number
      }>
    ).map((o) => [o.id, o])
  )
  for (const item of items) {
    const offer = item.offer_id ? offerMap.get(item.offer_id) : undefined
    if (
      offer?.offer_type === "wholesale" &&
      offer.bundle_size &&
      offer.bundle_size > 1
    ) {
      if (Number(item.quantity) % offer.bundle_size !== 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantity must be a multiple of pack size (${offer.bundle_size})`
        )
      }
    }
  }

  const { items: confirmInputs } = prepareOfferInventoryInput({
    input: {
      sales_channel_id: cart.sales_channel_id ?? undefined,
      items: items.map((i) => ({
        id: undefined,
        quantity: i.quantity,
        offer: { id: i.offer_id },
      })),
      offers: offers as never,
    },
  })

  const coverage = await promiseAll(
    confirmInputs
      .filter((entry) => entry.manage_inventory && !entry.allow_backorder)
      .map((entry) =>
        inventoryService.confirmInventory(
          entry.inventory_item_id,
          entry.location_ids,
          MathBN.mult(entry.required_quantity, entry.quantity),
        ),
      ),
  )

  if (coverage.some((hasCoverage) => !hasCoverage)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Some inventory item linked to an offer does not have sufficient stock",
      MedusaError.Codes.INSUFFICIENT_INVENTORY,
    )
  }
})

updateLineItemInCartWorkflow.hooks.validate(
  async ({ input, cart }, { container }) => {
    const newQuantity = input.update?.quantity
    if (newQuantity === undefined || newQuantity === null) {
      return
    }
    if (MathBN.lte(newQuantity, 0)) {
      return
    }

    const line = (cart.items ?? []).find(
      (i: { id: string }) => i.id === input.item_id,
    )
    if (!line) {
      return
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const inventoryService = container.resolve(Modules.INVENTORY)

    const { data: cartLines } = await query.graph({
      entity: "line_item",
      fields: ["id", "offer.id", "offer.offer_type", "offer.bundle_size"],
      filters: { id: [input.item_id] },
    })
    const cartLine = cartLines[0] as
      | {
          id: string
          offer?: {
            id?: string
            offer_type?: string
            bundle_size?: number
          }
        }
      | undefined
    const offerId = cartLine?.offer?.id
    if (!offerId) {
      return
    }

    const { data: offers } = await query.graph({
      entity: "offer",
      fields: [
        ...requiredOfferFieldsForInventoryConfirmation,
        "offer_type",
        "bundle_size",
      ],
      filters: { id: [offerId] },
    })

    const offer = offers[0] as
      | {
          id: string
          offer_type?: string
          bundle_size?: number
        }
      | undefined

    const effectiveOffer = offer || cartLine?.offer
    if (
      effectiveOffer?.offer_type === "wholesale" &&
      effectiveOffer.bundle_size &&
      effectiveOffer.bundle_size > 1
    ) {
      if (Number(newQuantity) % effectiveOffer.bundle_size !== 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Quantity must be a multiple of pack size (${effectiveOffer.bundle_size})`
        )
      }
    }

    const { items: confirmInputs } = prepareOfferInventoryInput({
      input: {
        sales_channel_id: cart.sales_channel_id ?? undefined,
        items: [
          {
            id: input.item_id,
            quantity: newQuantity,
            offer: { id: offerId },
          },
        ],
        offers: offers as never,
      },
    })

    const coverage = await promiseAll(
      confirmInputs
        .filter((entry) => entry.manage_inventory && !entry.allow_backorder)
        .map((entry) =>
          inventoryService.confirmInventory(
            entry.inventory_item_id,
            entry.location_ids,
            MathBN.mult(entry.required_quantity, entry.quantity),
          ),
        ),
    )

    if (coverage.some((hasCoverage) => !hasCoverage)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot increase quantity: an inventory item linked to the offer is out of stock",
        MedusaError.Codes.INSUFFICIENT_INVENTORY,
      )
    }
  },
)
