"use client"

import { useState } from "react"
import { SellerDTO } from "@lib/data/seller"
import { BrandDTO } from "@lib/data/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text, Badge } from "@medusajs/ui"

import { HttpTypes } from "@medusajs/types"

interface WholesaleDiscoveryProps {
  sellers: SellerDTO[]
  brands: BrandDTO[]
  categories?: HttpTypes.StoreProductCategory[]
}

const EMPTY_CATEGORIES: HttpTypes.StoreProductCategory[] = []

export default function WholesaleDiscovery({
  sellers,
  brands,
  categories = EMPTY_CATEGORIES,
}: WholesaleDiscoveryProps) {
  const [activeTab, setActiveTab] = useState<"sellers" | "brands" | "categories">("sellers")

  return (
    <section className="py-12 border-b border-ui-border-base">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <Heading level="h2" className="text-2xl font-bold">
            Discover Wholesale Partners & Catalog
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Browse verified manufacturers, shop established brands, or explore departments
          </Text>
        </div>

        {/* Discovery Filter Switch */}
        <div className="flex bg-ui-bg-subtle p-1 rounded-xl border border-ui-border-base">
          <button
            type="button"
            onClick={() => setActiveTab("sellers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "sellers"
                ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                : "text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            Suppliers ({sellers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("brands")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "brands"
                ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                : "text-ui-fg-subtle hover:text-ui-fg-base"
            }`}
          >
            Brands ({brands.length})
          </button>
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "categories"
                  ? "bg-ui-bg-base text-ui-fg-base shadow-sm"
                  : "text-ui-fg-subtle hover:text-ui-fg-base"
              }`}
            >
              Categories ({categories.length})
            </button>
          )}
        </div>
      </div>

      {activeTab === "sellers" ? (
        <div>
          {sellers.length === 0 ? (
            <div className="text-center py-12 bg-ui-bg-subtle rounded-xl text-ui-fg-muted">
              No suppliers registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.slice(0, 6).map((seller) => (
                <LocalizedClientLink
                  key={seller.id}
                  href={`/sellers/${seller.handle}`}
                  className="group border border-ui-border-base rounded-xl p-5 bg-ui-bg-base hover:shadow-md hover:border-ui-fg-interactive transition flex flex-col justify-between"
                >
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-ui-bg-subtle flex items-center justify-center font-bold text-lg overflow-hidden border">
                      {seller.logo ? (
                        <img src={seller.logo} alt={seller.name} className="w-full h-full object-cover" />
                      ) : (
                        seller.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-x-2">
                        <Heading level="h3" className="text-base font-semibold group-hover:text-ui-fg-interactive transition">
                          {seller.name}
                        </Heading>
                        {seller.is_premium && (
                          <Badge size="2xsmall" color="orange">Verified</Badge>
                        )}
                      </div>
                      <Text className="text-xs text-ui-fg-muted">@{seller.handle}</Text>
                    </div>
                  </div>
                  <Text className="text-xs text-ui-fg-subtle line-clamp-2 mb-3">
                    {seller.description || "Direct wholesale supplier."}
                  </Text>
                  <div className="text-xs font-medium text-ui-fg-interactive flex items-center gap-x-1">
                    View Catalog &rarr;
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <LocalizedClientLink
              href="/sellers"
              className="inline-flex items-center text-sm font-medium text-ui-fg-interactive hover:underline"
            >
              Browse All Wholesale Sellers &rarr;
            </LocalizedClientLink>
          </div>
        </div>
      ) : activeTab === "brands" ? (
        <div>
          {brands.length === 0 ? (
            <div className="text-center py-12 bg-ui-bg-subtle rounded-xl text-ui-fg-muted">
              No brands registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.slice(0, 12).map((brand) => (
                <LocalizedClientLink
                  key={brand.id}
                  href={`/brands/${brand.handle}`}
                  className="group border border-ui-border-base rounded-xl p-4 flex flex-col items-center text-center bg-ui-bg-base hover:border-ui-fg-interactive hover:shadow-sm transition"
                >
                  <div className="w-16 h-16 rounded-xl bg-ui-bg-subtle flex items-center justify-center mb-3 overflow-hidden p-2">
                    {brand.logo ? (
                      <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="font-bold text-base text-ui-fg-muted">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <Heading level="h3" className="text-sm font-medium group-hover:text-ui-fg-interactive transition truncate w-full">
                    {brand.name}
                  </Heading>
                </LocalizedClientLink>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <LocalizedClientLink
              href="/brands"
              className="inline-flex items-center text-sm font-medium text-ui-fg-interactive hover:underline"
            >
              Browse All Wholesale Brands &rarr;
            </LocalizedClientLink>
          </div>
        </div>
      ) : (
        <div>
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-ui-bg-subtle rounded-xl text-ui-fg-muted">
              No categories found.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <LocalizedClientLink
                  key={cat.id}
                  href={`/categories/${cat.handle}`}
                  className="group border border-ui-border-base rounded-xl p-5 bg-ui-bg-base hover:border-ui-fg-interactive hover:shadow-sm transition flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base mb-3">
                      {cat.name.slice(0, 1).toUpperCase()}
                    </div>
                    <Heading level="h3" className="text-base font-semibold group-hover:text-ui-fg-interactive transition">
                      {cat.name}
                    </Heading>
                    {cat.description && (
                      <Text className="text-xs text-ui-fg-subtle line-clamp-1 mt-1">
                        {cat.description}
                      </Text>
                    )}
                  </div>
                  <div className="text-xs font-medium text-emerald-700 mt-4 flex items-center gap-1">
                    Explore &rarr;
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <LocalizedClientLink
              href="/categories"
              className="inline-flex items-center text-sm font-medium text-ui-fg-interactive hover:underline"
            >
              Browse All Wholesale Categories &rarr;
            </LocalizedClientLink>
          </div>
        </div>
      )}
    </section>
  )
}
