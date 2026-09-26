"use client"

import { useState } from "react"
import { SellerDTO } from "@lib/data/seller"
import { BrandDTO } from "@lib/data/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
  const [activeTab, setActiveTab] = useState<"brands" | "sellers" | "categories">("brands")

  return (
    <section className="py-16 border-b border-stone-200 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-600 mb-1.5 block">
            Direct B2B Sourcing
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal-900 tracking-tight">
            Discover Verified Brands & Makers
          </h2>
          <p className="text-stone-600 text-sm mt-2 max-w-xl">
            Source from curated apparel brands, verified fashion manufacturers, and specialized product categories.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-sand-100 p-1 rounded-full border border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab("brands")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === "brands"
                ? "bg-white text-charcoal-900 shadow-sm"
                : "text-stone-600 hover:text-charcoal-900"
            }`}
          >
            Featured Brands ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sellers")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === "sellers"
                ? "bg-white text-charcoal-900 shadow-sm"
                : "text-stone-600 hover:text-charcoal-900"
            }`}
          >
            Manufacturers ({sellers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition ${
              activeTab === "categories"
                ? "bg-white text-charcoal-900 shadow-sm"
                : "text-stone-600 hover:text-charcoal-900"
            }`}
          >
            Departments ({categories.length})
          </button>
        </div>
      </div>

      {/* BRANDS TAB (Faire Brand Showcase) */}
      {activeTab === "brands" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-500 bg-sand-50 rounded-xl border border-stone-200">
              No brands listed yet.
            </div>
          ) : (
            brands.map((brand) => (
              <LocalizedClientLink
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group flex flex-col justify-between p-6 rounded-2xl bg-white border border-stone-200/90 hover:border-charcoal-900/40 hover:shadow-md transition duration-200"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl border border-stone-200 bg-sand-50 overflow-hidden flex items-center justify-center font-serif text-lg font-bold text-charcoal-900">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        brand.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full border border-forest-700/20">
                      Ships in 2-4 days
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-charcoal-900 group-hover:text-terracotta-600 transition mb-1">
                    {brand.name}
                  </h3>

                  {brand.story ? (
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                      {brand.story}
                    </p>
                  ) : (
                    <p className="text-xs text-stone-500 italic mb-4">
                      Independent wholesale fashion label.
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-900">
                    Min. Order: $150
                  </span>
                  <span className="text-stone-500 group-hover:text-terracotta-600 font-medium inline-flex items-center gap-1 transition">
                    View Line Sheet &rarr;
                  </span>
                </div>
              </LocalizedClientLink>
            ))
          )}
        </div>
      )}

      {/* SELLERS / MANUFACTURERS TAB */}
      {activeTab === "sellers" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-500 bg-sand-50 rounded-xl border border-stone-200">
              No verified suppliers listed yet.
            </div>
          ) : (
            sellers.map((seller) => (
              <LocalizedClientLink
                key={seller.id}
                href={`/sellers/${seller.handle}`}
                className="group flex flex-col justify-between p-6 rounded-2xl bg-white border border-stone-200/90 hover:border-charcoal-900/40 hover:shadow-md transition duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-sand-100 border border-stone-200 flex items-center justify-center font-bold text-sm text-charcoal-900">
                      {seller.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[11px] font-semibold text-charcoal-900 bg-sand-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                      Direct Factory
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-charcoal-900 group-hover:text-terracotta-600 transition mb-1">
                    {seller.name}
                  </h3>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                    {seller.description || "Direct supplier specializing in bulk apparel manufacturing and supply."}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">
                    {seller.handle}.factorytribe.com
                  </span>
                  <span className="font-medium text-terracotta-600">
                    Visit Showroom &rarr;
                  </span>
                </div>
              </LocalizedClientLink>
            ))
          )}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-500 bg-sand-50 rounded-xl border border-stone-200">
              No categories available.
            </div>
          ) : (
            categories.map((category) => (
              <LocalizedClientLink
                key={category.id}
                href={`/categories/${category.handle}`}
                className="p-5 rounded-xl bg-white border border-stone-200 hover:border-charcoal-900 hover:shadow-sm transition group"
              >
                <h4 className="font-serif text-base font-bold text-charcoal-900 group-hover:text-terracotta-600 transition mb-1">
                  {category.name}
                </h4>
                <span className="text-xs text-stone-500">
                  Browse wholesale items &rarr;
                </span>
              </LocalizedClientLink>
            ))
          )}
        </div>
      )}
    </section>
  )
}
