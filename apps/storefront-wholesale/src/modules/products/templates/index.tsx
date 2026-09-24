import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col lg:flex-row gap-8 lg:gap-12 items-start py-8 relative"
        data-testid="product-container"
      >
        {/* Left Column: Product Image Gallery */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-24 self-start">
          <ImageGallery images={images} />
        </div>

        {/* Right Column: Title, Grid (variant id, MRP, Price, +/-), Description Box, Product Information */}
        <div className="w-full lg:w-7/12 flex flex-col gap-y-6">
          {/* Product Header / Title */}
          <div className="flex flex-col gap-y-2">
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="text-xs uppercase tracking-wider font-semibold text-ui-fg-muted hover:text-ui-fg-base transition-colors"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}
            <Heading
              level="h1"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-ui-fg-base"
              data-testid="product-title"
            >
              {product.title}
            </Heading>
          </div>

          <ProductOnboardingCta />

          {/* Cart Addition Grid (Live with prices & offers) */}
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>

          {/* Below it: Description Box */}
          <div className="border border-ui-border-base rounded-xl p-5 bg-white shadow-sm flex flex-col gap-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-fg-base">
              Description
            </h3>
            <Text
              className="text-sm text-ui-fg-subtle whitespace-pre-line leading-relaxed"
              data-testid="product-description"
            >
              {product.description || "No description provided for this product."}
            </Text>
          </div>

          {/* Below it: Product Information etc. */}
          <div className="border border-ui-border-base rounded-xl p-5 bg-white shadow-sm flex flex-col gap-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-ui-fg-base">
              Product Information
            </h3>
            <ProductTabs product={product} />
          </div>
        </div>
      </div>

      <div
        className="content-container my-16 small:my-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
