import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/atoms/Breadcrumbs/Breadcrumbs';
import { ProductListingSkeleton } from '@/components/organisms/ProductListingSkeleton/ProductListingSkeleton';
import { SearchProductsListing } from '@/components/sections/ProductListing/SearchProductsListing';
import type { Metadata } from "next"
import { getBaseUrl } from "@/lib/helpers/base-url"
import { listRegions } from "@/lib/data/regions"
import { searchProducts } from "@/lib/data/products"
import { getSellerByHandle } from "@/lib/data/seller"
import { PRODUCT_LIMIT } from "@/const"
import { headers } from "next/headers"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"


export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const baseUrl = getBaseUrl()

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: "/categories",
    locale,
    locales,
  })

  const title = "All Products"
  const description = `Browse all products on ${
    process.env.NEXT_PUBLIC_SITE_NAME || "our store"
  }`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ${process.env.NEXT_PUBLIC_SITE_NAME || "Storefront"}`,
      description,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Storefront",
      type: "website",
    },
  }
}

export default function AllCategories({
  params,
  searchParams,
}: PageProps<"/[locale]/categories">) {
  return (
    <main className="container">
      <Suspense
        fallback={
          <div aria-busy="true" data-testid="all-categories-loading">
            <ProductListingSkeleton />
          </div>
        }
      >
        <CategoriesContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function CategoriesContent({
  params,
  searchParams,
}: PageProps<"/[locale]/categories">) {
  const { locale } = await params

  const breadcrumbsItems = [
    {
      path: "/",
      label: "All Products",
    },
  ]

  const baseUrl = getBaseUrl()

  const headersList = await headers()
  const isTenant = headersList.get("x-is-tenant") === "true"
  const tenantHandle = headersList.get("x-tenant-handle")
  let sellerId: string | undefined
  if (isTenant && tenantHandle) {
    const seller = await getSellerByHandle(tenantHandle).catch(() => null)
    if (seller) {
      sellerId = seller.id
    }
  }

  const { products: jsonLdProducts } = await searchProducts({
    countryCode: locale,
    seller_id: sellerId,
    limit: PRODUCT_LIMIT,
  })

  const itemList = jsonLdProducts.slice(0, 8).map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${baseUrl}/${locale}/products/${p.handle}`,
    name: p.title,
  }))

  return (
    <>
      <script
        id="ld-breadcrumbs-categories"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "All Products",
                item: `${baseUrl}/${locale}/categories`,
              },
            ],
          }),
        }}
      />
      <script
        id="ld-itemlist-categories"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: itemList,
          }),
        }}
      />
      <div className="hidden md:block mb-2">
        <Breadcrumbs items={breadcrumbsItems} />
      </div>

      <h1 className="heading-xl uppercase">All Products</h1>

      <SearchProductsListing
        seller_id={sellerId}
        locale={locale}
        searchParams={searchParams}
      />
    </>
  )
}
