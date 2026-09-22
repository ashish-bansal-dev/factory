"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import WholesaleInquiryModal from "../wholesale-inquiry-modal"
import { SellerDTO } from "@lib/data/seller"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  isTenant?: boolean
  seller?: SellerDTO
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  isTenant,
  seller,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isInquiryOpen, setIsInquiryOpen] = useState(false)

  const [options, setOptions] = useState<Record<string, string | undefined>>(() => {
    const vId = searchParams.get("v_id")
    if (vId) {
      const matched = product.variants?.find((v) => v.id === vId)
      if (matched?.options) {
        return optionsAsKeymap(matched.options) ?? {}
      }
    }
    if (product.variants?.length === 1) {
      return optionsAsKeymap(product.variants[0].options) ?? {}
    }
    return {}
  })
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant or v_id changed, keep options in sync
  useEffect(() => {
    const vId = searchParams.get("v_id")
    if (vId) {
      const matched = product.variants?.find((v) => v.id === vId)
      if (matched?.options) {
        setOptions(optionsAsKeymap(matched.options) ?? {})
        return
      }
    }
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants, searchParams])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    if (!selectedVariant) {
      return false
    }

    // If back orders are enabled on the variant/offer, allow adding to cart
    if (selectedVariant.allow_backorder) {
      return true
    }

    // If there is inventory/stock available, allow adding to cart
    if ((selectedVariant.inventory_quantity ?? 0) > 0) {
      return true
    }

    // When there is no stock, do not enable add to cart unless backorder is enabled
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const offerId = (selectedVariant as { offer_id?: string | null })?.offer_id
  const hasOffer = Boolean(offerId)

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      offerId: offerId ?? undefined,
      quantity: 1,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} isTenant={isTenant} />

        {!isTenant ? (
          <div className="flex flex-col gap-y-2">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs text-emerald-900">
              <div className="font-semibold flex items-center gap-1.5 text-emerald-800 mb-0.5">
                <span>Direct Wholesale Sourcing</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Factory-direct pricing and bulk deals. Connect with verified suppliers directly on WhatsApp.
              </p>
            </div>

            <Button
              onClick={() => setIsInquiryOpen(true)}
              variant="primary"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2"
              data-testid="wholesale-inquiry-button"
            >
              Connect for Wholesale Deal (WhatsApp) →
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Button
              onClick={handleAddToCart}
              disabled={
                !inStock ||
                !selectedVariant ||
                !!disabled ||
                isAdding ||
                !isValidVariant ||
                !hasOffer
              }
              variant="primary"
              className="w-full h-10"
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              {!selectedVariant && !options
                ? "Select variant"
                : !hasOffer
                ? "No offer available"
                : !inStock || !isValidVariant
                ? "Out of stock"
                : "Add to cart"}
            </Button>

            <Button
              onClick={() => setIsInquiryOpen(true)}
              variant="secondary"
              className="w-full h-10 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium text-xs"
            >
              Inquire with Brand via WhatsApp →
            </Button>
          </div>
        )}

        <WholesaleInquiryModal
          isOpen={isInquiryOpen}
          close={() => setIsInquiryOpen(false)}
          productId={product.id}
          productTitle={product.title}
          variantId={selectedVariant?.id}
          sellerId={seller?.id}
          sellerName={seller?.name}
          isTenant={isTenant}
        />

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          isTenant={isTenant}
          onOpenInquiry={() => setIsInquiryOpen(true)}
        />
      </div>
    </>
  )
}
