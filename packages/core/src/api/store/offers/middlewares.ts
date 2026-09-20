import {
  authenticate,
  clearFiltersByKey,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
} from "@medusajs/framework/http"
import { validateAndTransformQuery } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"
import {
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "@medusajs/medusa/api/utils/middlewares/index"

import { storeOfferQueryConfig } from "./query-config"
import { StoreGetOfferParams, StoreGetOffersParams } from "./validators"
import { resolveVisibleSellerIds } from "../../utils/sellers"
import { getProductIdsRestrictedFromSeller } from "../../vendor/products/helpers"

async function applyVisibleSellerIdsFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}

  const visibleSellerIds = await resolveVisibleSellerIds(req.scope)
  const requested = req.filterableFields.seller_id as
    | string
    | string[]
    | undefined

  // Honor a client-supplied `seller_id` filter, but never let it widen scope
  // beyond the visible sellers — intersect the two instead of overwriting.
  if (requested) {
    const requestedIds = Array.isArray(requested) ? requested : [requested]
    const visibleSet = new Set(visibleSellerIds)
    req.filterableFields.seller_id = requestedIds.filter((id) =>
      visibleSet.has(id)
    )
  } else {
    req.filterableFields.seller_id = visibleSellerIds
  }

  next()
}

async function applyPublishedProductFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}
  const requested = req.filterableFields.product_id as
    | string
    | string[]
    | undefined

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: {
      status: ProductStatus.PUBLISHED,
      ...(requested ? { id: requested } : {}),
    },
  })

  req.filterableFields.product_id = products.map((p: { id: string }) => p.id)
  next()
}

async function applyProductSellerScopeFilter(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  req.filterableFields ??= {}
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const currentSellerIds = req.filterableFields.seller_id as
    | string
    | string[]
    | undefined

  if (currentSellerIds) {
    const sellerList = Array.isArray(currentSellerIds)
      ? currentSellerIds
      : [currentSellerIds]
    if (sellerList.length === 1) {
      const restrictedProductIds = await getProductIdsRestrictedFromSeller(
        req.scope,
        sellerList[0]
      )
      if (
        restrictedProductIds.length &&
        Array.isArray(req.filterableFields.product_id)
      ) {
        const restrictedSet = new Set(restrictedProductIds)
        req.filterableFields.product_id = (
          req.filterableFields.product_id as string[]
        ).filter((id) => !restrictedSet.has(id))
      }
    }
  }

  const requestedProduct = req.filterableFields.product_id as
    | string
    | string[]
    | undefined

  if (requestedProduct) {
    const productList = Array.isArray(requestedProduct)
      ? requestedProduct
      : [requestedProduct]

    const { data: productSellers } = await query.graph({
      entity: "product_seller",
      fields: ["product_id", "seller_id"],
      filters: { product_id: productList },
    })

    if (productSellers.length > 0) {
      const allowedSellers = new Set(
        (productSellers as { seller_id: string }[]).map((ps) => ps.seller_id)
      )
      const current = Array.isArray(req.filterableFields.seller_id)
        ? req.filterableFields.seller_id
        : [req.filterableFields.seller_id].filter(Boolean)

      req.filterableFields.seller_id = (current as string[]).filter((id) =>
        allowedSellers.has(id)
      )
    }
  }

  const requestedVariant = req.filterableFields.variant_id as
    | string
    | string[]
    | undefined

  if (requestedVariant) {
    const variantList = Array.isArray(requestedVariant)
      ? requestedVariant
      : [requestedVariant]

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id"],
      filters: { id: variantList },
    })

    const variantProductIds = (variants as { product_id?: string }[])
      .map((v) => v.product_id)
      .filter(Boolean) as string[]

    if (variantProductIds.length > 0) {
      const { data: productSellers } = await query.graph({
        entity: "product_seller",
        fields: ["product_id", "seller_id"],
        filters: { product_id: variantProductIds },
      })

      if (productSellers.length > 0) {
        const allowedSellers = new Set(
          (productSellers as { seller_id: string }[]).map((ps) => ps.seller_id)
        )
        const current = Array.isArray(req.filterableFields.seller_id)
          ? req.filterableFields.seller_id
          : [req.filterableFields.seller_id].filter(Boolean)

        req.filterableFields.seller_id = (current as string[]).filter((id) =>
          allowedSellers.has(id)
        )
      }
    }
  }

  next()
}

const pricingMiddlewares = [
  normalizeDataForContext({ priceFieldPaths: ["calculated_price"] }),
  setPricingContext({ priceFieldPaths: ["calculated_price"] }),
  setTaxContext({ priceFieldPaths: ["calculated_price"] }),
]

const offerMiddlewares = [
  authenticate("customer", ["session", "bearer"], {
    allowUnauthenticated: true,
  }),
  applyVisibleSellerIdsFilter,
  applyPublishedProductFilter,
  applyProductSellerScopeFilter,
  ...pricingMiddlewares,
  clearFiltersByKey(["region_id", "country_code", "province", "cart_id"]),
]

export const storeOffersMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/offers",
    middlewares: [
      validateAndTransformQuery(
        StoreGetOffersParams,
        storeOfferQueryConfig.list
      ),
      ...offerMiddlewares,
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/offers/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetOfferParams,
        storeOfferQueryConfig.retrieve
      ),
      ...offerMiddlewares,
    ],
  },
]
