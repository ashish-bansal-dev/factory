import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  OrderStatus,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { createOrderWorkflow } from "@medusajs/core-flows"
import InquiryModuleService from "../../../../../modules/inquiry/service"
import { VendorCreateDraftOrderFromInquiryType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateDraftOrderFromInquiryType>,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Seller context is required"
    )
  }

  const inquiryId = req.params.id
  const inquiryService = req.scope.resolve<InquiryModuleService>(MercurModules.INQUIRY)

  let inquiry: any
  try {
    inquiry = await inquiryService.retrieveWholesaleInquiry(inquiryId)
  } catch {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inquiry with id ${inquiryId} was not found`
    )
  }

  if (!inquiry) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inquiry with id ${inquiryId} was not found`
    )
  }

  if (inquiry.seller_id && inquiry.seller_id !== sellerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Seller does not own this inquiry"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const body = req.validatedBody

  // Resolve variant details
  const variantIds = body.items.map((i) => i.variant_id)
  let variantMap = new Map<string, any>()
  if (variantIds.length > 0 && query?.graph) {
    try {
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "sku", "product.title"],
        filters: { id: variantIds },
      })
      if (Array.isArray(variants)) {
        variantMap = new Map(variants.map((v: any) => [v.id, v]))
      }
    } catch {
      // ignore
    }
  }

  // Resolve currency code & region
  let regionId = body.region_id
  let currencyCode = body.currency_code

  if ((!regionId || !currencyCode) && query?.graph) {
    try {
      const { data: regions } = await query.graph({
        entity: "region",
        fields: ["id", "currency_code"],
      })
      if (regions && regions.length > 0) {
        if (!regionId) regionId = regions[0].id
        if (!currencyCode) currencyCode = regions[0].currency_code
      }
    } catch {
      // ignore
    }
  }

  if (!currencyCode) {
    currencyCode = "usd"
  }

  // Resolve buyer email
  const email =
    body.email ||
    (inquiry.metadata?.email as string) ||
    (inquiry.metadata?.contact_email as string) ||
    (inquiry.contact_number
      ? `${inquiry.contact_number.replace(/[^0-9]/g, "")}@inquiry.local`
      : `${inquiry.id}@inquiry.local`)

  const orderItems = body.items.map((item) => {
    const variant = variantMap.get(item.variant_id)
    return {
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      title: item.title || variant?.title || "Custom Wholesale Pack",
      metadata: {
        ...(item.metadata || {}),
        unit_price: item.unit_price,
      },
    }
  })

  // Handle shipping methods if shipping_amount provided
  let shippingMethods: any[] | undefined = undefined
  if (body.shipping_amount !== undefined && query?.graph) {
    try {
      const { data: shippingOptions } = await query.graph({
        entity: "shipping_option",
        fields: ["id", "name"],
        filters: { seller_id: sellerId },
      })
      if (shippingOptions && shippingOptions.length > 0) {
        shippingMethods = [
          {
            name: shippingOptions[0].name || "Standard Shipping",
            shipping_option_id: shippingOptions[0].id,
            amount: body.shipping_amount,
          },
        ]
      }
    } catch {
      // ignore
    }
  }

  const metadata: Record<string, unknown> = {
    ...(body.metadata || {}),
    inquiry_id: inquiry.id,
    seller_id: sellerId,
    ...(body.notes ? { notes: body.notes } : {}),
    ...(body.shipping_amount !== undefined
      ? { shipping_amount: body.shipping_amount }
      : {}),
  }

  const workflowInput: Record<string, unknown> = {
    status: OrderStatus.DRAFT,
    is_draft_order: true,
    items: orderItems,
    currency_code: currencyCode,
    email,
    metadata,
  }

  if (regionId) {
    workflowInput.region_id = regionId
  }
  if (body.customer_id) {
    workflowInput.customer_id = body.customer_id
  }
  if (body.billing_address) {
    if (typeof body.billing_address === "string") {
      workflowInput.billing_address_id = body.billing_address
    } else {
      workflowInput.billing_address = body.billing_address
    }
  }
  if (body.shipping_address) {
    if (typeof body.shipping_address === "string") {
      workflowInput.shipping_address_id = body.shipping_address
    } else {
      workflowInput.shipping_address = body.shipping_address
    }
  }
  if (shippingMethods && shippingMethods.length > 0) {
    workflowInput.shipping_methods = shippingMethods
  }

  const { result: orderResult } = await createOrderWorkflow(req.scope).run({
    input: workflowInput as any,
  })

  // Link draft order to seller
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.LINK)
  if (remoteLink?.create) {
    await remoteLink.create([
      {
        [Modules.ORDER]: { order_id: orderResult.id },
        [MercurModules.SELLER]: { seller_id: sellerId },
      },
    ])
  }

  // Update inquiry status to converted with metadata.draft_order_id
  const updatedInquiries = await inquiryService.updateWholesaleInquiries({
    id: inquiry.id,
    status: "converted",
    metadata: {
      ...(inquiry.metadata || {}),
      draft_order_id: orderResult.id,
    },
  })

  const updatedInquiry = Array.isArray(updatedInquiries)
    ? updatedInquiries[0]
    : updatedInquiries

  let draftOrder = orderResult
  if (query?.graph) {
    try {
      const {
        data: [fetchedOrder],
      } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "status",
          "is_draft_order",
          "currency_code",
          "total",
          "subtotal",
          "items.*",
          "shipping_methods.*",
          "metadata",
        ],
        filters: { id: orderResult.id },
      })
      if (fetchedOrder) {
        draftOrder = fetchedOrder
      }
    } catch {
      // fallback to orderResult
    }
  }

  res.status(200).json({
    draft_order: draftOrder,
    inquiry: updatedInquiry,
  })
}
