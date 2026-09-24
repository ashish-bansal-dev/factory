import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { defaultStoreCartFields, refetchCart } from "../../helpers"
import { resolveVisibleSellerIds } from "../../../../utils/sellers"
import { StoreAddCartLineItemType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreAddCartLineItemType>,
  res: MedusaResponse,
) => {
  const cart_id = req.params.id
  const { additional_data, metadata, offer_id, ...item } = req.validatedBody

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: offers } = await query.graph({
    entity: "offer",
    fields: [
      "id",
      "variant_id",
      "seller_id",
      "product_id",
      "offer_type",
      "bundle_size",
    ],
    filters: { id: offer_id },
  })

  const offer = offers[0] as
    | {
        id: string
        variant_id: string
        seller_id?: string
        product_id?: string
        offer_type?: string
        bundle_size?: number
      }
    | undefined
  if (!offer) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Offer ${offer_id} not found`,
    )
  }

  if (
    offer.offer_type === "wholesale" &&
    offer.bundle_size &&
    offer.bundle_size > 1
  ) {
    if (item.quantity % offer.bundle_size !== 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Quantity must be a multiple of pack size (${offer.bundle_size})`,
      )
    }
  }

  if (offer.seller_id) {
    const visibleSellerIds = await resolveVisibleSellerIds(req.scope)
    if (!visibleSellerIds.includes(offer.seller_id)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Offer ${offer_id} is currently unavailable`,
      )
    }

    let effectiveSellerId: string | undefined =
      typeof req.headers?.["x-seller-id"] === "string" ? req.headers["x-seller-id"] : undefined

    if (!effectiveSellerId && typeof req.headers?.["x-tenant-handle"] === "string") {
      const tenantHandle = req.headers["x-tenant-handle"]
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id"],
        filters: { handle: tenantHandle },
      }).catch(() => ({ data: [] }))
      effectiveSellerId = (sellers?.[0] as { id?: string })?.id
    }

    if (effectiveSellerId && offer.seller_id !== effectiveSellerId) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot add an offer from another seller to this tenant cart`,
      )
    }
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
        MedusaError.Types.NOT_ALLOWED,
        `Offer ${offer_id} is not available for this product`,
      )
    }
  }

  await addToCartWorkflow(req.scope).run({
    input: {
      cart_id,
      items: [
        {
          ...item,
          variant_id: offer.variant_id,
          offer_id,
          requires_shipping: true,
          metadata: {
            ...(metadata ?? {}),
            offer_id,
            bundle_size: offer.bundle_size ?? 1,
            offer_type: offer.offer_type ?? "retail",
            mrp: (offer as any).mrp ?? null,
          },
        },
      ],
      additional_data,
    },
  })


  const cart = await refetchCart(cart_id, req.scope, defaultStoreCartFields)
  res.status(200).json({ cart })
}
