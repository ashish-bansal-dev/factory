import { Suspense } from "react"
import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import { headers } from "next/headers"
import { getTenantSeller } from "@lib/data/seller"

export default async function Nav() {
  const headersList = await headers()
  const isTenant = headersList.get("x-is-tenant") === "true"
  const tenantHandle = headersList.get("x-tenant-handle")
  const customDomain = headersList.get("x-custom-domain")

  const [regions, locales, currentLocale, tenantSeller] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    isTenant ? getTenantSeller(tenantHandle, customDomain) : Promise.resolve(null),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 group font-sans">
      {/* Editorial Trust Announcement Bar (Faire-style) */}
      <div className="bg-forest-900 text-sand-50 py-1.5 px-4 text-xs font-medium tracking-wide">
        <div className="content-container flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-0.5">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 inline-block" />
              Wholesale Only B2B Marketplace
            </span>
            <span className="hidden md:inline-block text-forest-700">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-stone-300 whitespace-nowrap">
              Net 60 Terms for Eligible Retailers
            </span>
            <span className="hidden lg:inline-block text-forest-700">|</span>
            <span className="hidden lg:flex items-center gap-1.5 text-stone-300 whitespace-nowrap">
              Direct Manufacturer Pack Pricing
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-stone-300 text-[11px]">
            <a
              href="https://vendor.factorytribe.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Sell on FactoryTribe
            </a>
            <span>•</span>
            <LocalizedClientLink href="/account" className="hover:text-white transition">
              Wholesale Support
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="relative bg-white/95 backdrop-blur border-b border-stone-200">
        <nav className="content-container flex items-center justify-between gap-4 h-18 py-3">
          {/* Left: Mobile Menu & Brand Navigation */}
          <div className="flex items-center gap-x-4">
            <div className="h-full flex items-center">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                isTenant={isTenant}
              />
            </div>

            {/* Logo */}
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2.5 group"
              data-testid="nav-store-link"
            >
              {isTenant && tenantSeller ? (
                <div className="flex items-center gap-2.5">
                  {tenantSeller.logo ? (
                    <img
                      src={tenantSeller.logo}
                      alt={tenantSeller.name}
                      className="w-8 h-8 rounded-lg object-contain border border-stone-200 bg-white"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-sand-100 border border-stone-200 flex items-center justify-center font-bold text-xs text-charcoal-900">
                      {tenantSeller.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <span className="font-serif text-lg font-bold text-charcoal-900 group-hover:text-terracotta-600 transition">
                      {tenantSeller.name}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wider text-stone-500 font-sans">
                      Wholesale Showroom
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-2xl font-bold tracking-tight text-charcoal-900 group-hover:text-terracotta-600 transition">
                    FactoryTribe
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sand-100 text-charcoal-800 border border-stone-200">
                    B2B Wholesale
                  </span>
                </div>
              )}
            </LocalizedClientLink>

            {/* Desktop Navigation Links */}
            {!isTenant && (
              <div className="hidden lg:flex items-center gap-x-6 text-sm font-medium text-stone-700 ml-4">
                <LocalizedClientLink
                  href="/store"
                  className="hover:text-terracotta-600 transition"
                >
                  Shop Catalog
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/brands"
                  className="hover:text-terracotta-600 transition"
                >
                  Brands & Makers
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/sellers"
                  className="hover:text-terracotta-600 transition"
                >
                  Suppliers
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/categories"
                  className="hover:text-terracotta-600 transition"
                >
                  Categories
                </LocalizedClientLink>
              </div>
            )}
          </div>

          {/* Right: Actions (Account & Cart) */}
          <div className="flex items-center gap-x-5 justify-end">
            <LocalizedClientLink
              className="hidden sm:inline-flex items-center text-sm font-medium text-stone-700 hover:text-terracotta-600 transition"
              href="/account"
              data-testid="nav-account-link"
            >
              Wholesale Account
            </LocalizedClientLink>

            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-terracotta-600 text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-200 bg-sand-50"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <div className="flex items-center">
                <CartButton />
              </div>
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
