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
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center gap-x-4">
            <div className="h-full">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                isTenant={isTenant}
              />
            </div>
            {!isTenant && (
              <div className="hidden md:flex items-center gap-x-5 text-xs font-medium">
                <LocalizedClientLink href="/sellers" className="hover:text-ui-fg-base transition">
                  Suppliers
                </LocalizedClientLink>
                <LocalizedClientLink href="/brands" className="hover:text-ui-fg-base transition">
                  Brands
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories" className="hover:text-ui-fg-base transition">
                  Categories
                </LocalizedClientLink>
              </div>
            )}
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase flex items-center gap-x-2"
              data-testid="nav-store-link"
            >
              {isTenant && tenantSeller ? (
                <>
                  {tenantSeller.logo && (
                    <img
                      src={tenantSeller.logo}
                      alt={tenantSeller.name}
                      className="w-7 h-7 rounded-md object-contain inline-block"
                    />
                  )}
                  <span>{tenantSeller.name}</span>
                  <span className="text-[10px] font-normal lowercase tracking-normal px-2 py-0.5 rounded bg-ui-bg-subtle text-ui-fg-muted">
                    Wholesale
                  </span>
                </>
              ) : (
                process.env.NEXT_PUBLIC_SITE_NAME || "Wholesale Hub"
              )}
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <LocalizedClientLink
                className="hover:text-ui-fg-base"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
