"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import WholesaleInquiryModal from "../wholesale-inquiry-modal"
import QuickVariantGrid from "../quick-variant-grid"
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

  const hasMultipleVariants = (product.variants?.length ?? 0) > 1
  const [orderMode, setOrderMode] = useState<"grid" | "single">("grid")

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

  const bundleSize =
    Number((selectedVariant as any)?.bundle_size) ||
    Number((selectedVariant as any)?.calculated_price?.bundle_size) ||
    1

  const [quantity, setQuantity] = useState<number>(bundleSize)

  useEffect(() => {
    setQuantity(bundleSize)
  }, [bundleSize, selectedVariant?.id])

  const handleIncrement = () => {
    setQuantity((prev) => prev + bundleSize)
  }

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(bundleSize, prev - bundleSize))
  }

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      offerId: offerId ?? undefined,
      quantity,
      countryCode,
    })

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-3" ref={actionsRef}>
        {!isTenant && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs text-emerald-900">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800 mb-0.5">
              <span>Direct Wholesale Sourcing</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Factory-direct pricing and bulk deals. Add to cart for direct order/quote or connect with suppliers directly on WhatsApp.
            </p>
          </div>
        )}

        {hasMultipleVariants && (
          <div className="flex border border-ui-border-base rounded-md p-0.5 bg-ui-bg-subtle mb-1">
            <button
              type="button"
              onClick={() => setOrderMode("grid")}
              className={clx(
                "flex-1 py-1.5 text-xs font-medium rounded transition text-center",
                orderMode === "grid"
                  ? "bg-white text-ui-fg-base shadow-sm font-semibold"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              )}
            >
              Quick Variant Grid
            </button>
            <button
              type="button"
              onClick={() => setOrderMode("single")}
              className={clx(
                "flex-1 py-1.5 text-xs font-medium rounded transition text-center",
                orderMode === "single"
                  ? "bg-white text-ui-fg-base shadow-sm font-semibold"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              )}
            >
              Select Options
            </button>
          </div>
        )}

        {orderMode === "grid" ? (
          <QuickVariantGrid
            product={product}
            countryCode={countryCode}
            disabled={disabled}
            onOpenInquiry={() => setIsInquiryOpen(true)}
          />
        ) : (
          <div className="flex flex-col gap-y-3">
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

            {hasOffer && inStock && (
              <div className="flex items-center justify-between border border-ui-border-base rounded-md p-2.5 bg-ui-bg-subtle/50">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-ui-fg-base">
                    Pack Quantity
                  </span>
                  <span className="text-[11px] text-ui-fg-muted">
                    {Math.round(quantity / bundleSize)} {Math.round(quantity / bundleSize) === 1 ? "pack" : "packs"} ({quantity} units)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={quantity <= bundleSize || isAdding}
                    className="w-8 h-8 flex items-center justify-center rounded border border-ui-border-base bg-white hover:bg-ui-bg-subtle disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-ui-fg-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={isAdding}
                    className="w-8 h-8 flex items-center justify-center rounded border border-ui-border-base bg-white hover:bg-ui-bg-subtle disabled:opacity-40 font-medium text-sm transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

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
                : bundleSize > 1
                ? `Add ${quantity} units (${Math.round(quantity / bundleSize)} pack${Math.round(quantity / bundleSize) > 1 ? "s" : ""}) to cart`
                : `Add to cart (${quantity})`}
            </Button>
          </div>
        )}

        <Button
          onClick={() => setIsInquiryOpen(true)}
          variant="secondary"
          className="w-full h-10 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-medium text-xs flex items-center justify-center gap-1.5"
          data-testid="wholesale-inquiry-button"
        >
          <span>Connect with Supplier on WhatsApp →</span>
        </Button>


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
