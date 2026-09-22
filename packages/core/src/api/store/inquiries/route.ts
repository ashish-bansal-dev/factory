import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import InquiryModuleService from "../../../modules/inquiry/service"
import { StoreCreateInquiryType } from "./validators"

export const POST = async (
  req: MedusaRequest<StoreCreateInquiryType>,
  res: MedusaResponse
) => {
  const inquiryService = req.scope.resolve<InquiryModuleService>(MercurModules.INQUIRY)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    store_name,
    contact_number,
    location,
    product_id,
    variant_id,
    seller_id,
    source_domain,
    notes,
    quantity,
  } = req.validatedBody

  // 1. Verify product existence and resolve variants & linked sellers
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "variants.id",
      "sellers.id",
      "sellers.name",
      "sellers.phone",
      "sellers.metadata",
    ],
    filters: { id: product_id },
  })

  const product = products?.[0]
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${product_id} was not found`
    )
  }

  // 2. Validate variant relationship if variant_id was provided
  if (variant_id) {
    const productVariants = (product.variants || []) as Array<{ id: string }>
    const variantMatches = productVariants.some((v) => v.id === variant_id)
    if (!variantMatches) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Variant with id: ${variant_id} does not belong to product: ${product_id}`
      )
    }
  }

  // 3. Validate seller relationship and resolve seller attribution
  const productSellers = (product.sellers || []) as Array<{
    id: string
    name?: string
    phone?: string
    metadata?: Record<string, unknown>
  }>

  let resolvedSeller: {
    id: string
    name?: string
    phone?: string
    metadata?: Record<string, unknown>
  } | null = null

  if (seller_id) {
    if (productSellers.length > 0) {
      const matched = productSellers.find((s) => s.id === seller_id)
      if (!matched) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product ${product_id} does not belong to seller: ${seller_id}`
        )
      }
      resolvedSeller = matched
    } else {
      // Verify seller exists if product has no explicit sellers attached
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "name", "phone", "metadata"],
        filters: { id: seller_id },
      })
      if (!sellers?.[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Seller with id: ${seller_id} was not found`
        )
      }
      resolvedSeller = sellers[0]
    }
  } else if (productSellers.length > 0) {
    resolvedSeller = productSellers[0]
  }

  // 4. Resolve target phone number and contact name
  let targetPhone = process.env.ADMIN_WHATSAPP_PHONE || "919999999999"
  let targetName = "FactoryTribe Wholesale Team"
  const productTitle = product.title || "Product"

  if (resolvedSeller) {
    if (resolvedSeller.phone) {
      targetPhone = resolvedSeller.phone.replace(/[^0-9]/g, "")
    } else if (resolvedSeller.metadata?.phone) {
      targetPhone = String(resolvedSeller.metadata.phone).replace(/[^0-9]/g, "")
    }
    if (resolvedSeller.name) {
      targetName = resolvedSeller.name
    }
  }

  targetPhone = targetPhone.replace(/[^0-9]/g, "")
  if (targetPhone.length === 10) {
    targetPhone = `91${targetPhone}`
  }

  // 5. Persist inquiry with validated IDs and product title in metadata
  const inquiry = await inquiryService.createWholesaleInquiries({
    store_name,
    contact_number,
    location,
    product_id: product.id,
    variant_id: variant_id ?? null,
    seller_id: resolvedSeller?.id ?? null,
    source_domain: source_domain ?? null,
    channel: "whatsapp",
    status: "new",
    metadata: {
      notes: notes ?? null,
      quantity: quantity ?? null,
      product_title: productTitle,
    },
  })

  const message = `Hi ${targetName}, I am ${store_name} (Phone: ${contact_number}) from ${location}. I am interested in wholesale pricing for "${productTitle}"${quantity ? ` (Quantity: ${quantity})` : ""}. Please share wholesale catalog, rates and MOQ terms.`

  const whatsapp_url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`

  res.status(201).json({
    inquiry,
    whatsapp_url,
  })
}
