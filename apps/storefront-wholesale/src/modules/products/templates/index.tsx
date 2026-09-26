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

import BrandTrustCard from "@modules/products/components/brand-trust-card"
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

  const seller = (product as any).seller

  return (
    <>
      <div
        className="content-container flex flex-col lg:flex-row gap-6 lg:gap-12 items-start py-6 sm:py-10 pb-28 sm:pb-12 relative font-sans"
        data-testid="product-container"
      >
        {/* Left Column: Product Image Gallery */}
        <div className="w-full lg:w-5/12 lg:sticky lg:top-24 self-start">
          <ImageGallery images={images} />
        </div>

        {/* Right Column: Title, Brand Card, Bulk Matrix, Description Box */}
        <div className="w-full lg:w-7/12 flex flex-col gap-y-6">
          {/* Product Header / Title */}
          <div className="flex flex-col gap-y-2">
            {product.collection && (
              <LocalizedClientLink
                href={`/collections/${product.collection.handle}`}
                className="text-xs uppercase tracking-wider font-semibold text-stone-500 hover:text-charcoal-900 transition-colors"
              >
                {product.collection.title}
              </LocalizedClientLink>
            )}
            <h1
              className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-charcoal-900"
              data-testid="product-title"
            >
              {product.title}
            </h1>
          </div>

          {/* Faire-style Brand Trust & MOV Card */}
          <BrandTrustCard
            seller={seller}
            productId={product.id}
            productTitle={product.title}
          />

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
          <div className="border border-stone-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-y-3">
            <h3 className="font-serif text-base font-bold text-charcoal-900">
              Product Overview & Fabric
            </h3>
            <Text
              className="text-sm text-stone-600 whitespace-pre-line leading-relaxed"
              data-testid="product-description"
            >
              {product.description || "No description provided for this product."}
            </Text>
          </div>

          {/* Below it: Specifications & Shipping */}
          <div className="border border-stone-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col gap-y-3">
            <h3 className="font-serif text-base font-bold text-charcoal-900">
              Wholesale Specifications & Shipping Policies
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
