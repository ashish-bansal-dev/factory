import { Metadata } from "next"
import { listBrands } from "@lib/data/brand"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Wholesale Brands Directory",
  description: "Explore top wholesale brands and authorized suppliers.",
}

export default async function BrandsPage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { countryCode: _countryCode } = await props.params
  const { q } = await props.searchParams

  const { brands } = await listBrands({ q })

  return (
    <div className="content-container py-12">
      <div className="flex flex-col gap-y-4 mb-8">
        <div>
          <Heading level="h1" className="text-3xl font-semibold">
            Wholesale Brands Directory
          </Heading>
          <Text className="text-ui-fg-subtle text-base mt-1">
            Discover established brands and find authorized wholesale distributors
          </Text>
        </div>

        {/* Search Bar */}
        <form method="GET" className="max-w-md mt-4">
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            aria-label="Search brands"
            placeholder="Search brands..."
            className="w-full px-4 py-2 text-sm border rounded-lg border-ui-border-base focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
          />
        </form>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-16 bg-ui-bg-subtle rounded-xl">
          <Text className="text-ui-fg-muted">
            No brands found matching your search.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <LocalizedClientLink
              key={brand.id}
              href={`/brands/${brand.handle}`}
              className="group border border-ui-border-base rounded-xl p-6 flex flex-col items-center text-center hover:shadow-md hover:border-ui-fg-interactive transition bg-ui-bg-base"
            >
              <div className="w-20 h-20 rounded-xl bg-ui-bg-subtle flex items-center justify-center mb-4 overflow-hidden p-2">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-xl text-ui-fg-muted">
                    {brand.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <Heading level="h3" className="text-base font-semibold group-hover:text-ui-fg-interactive transition">
                {brand.name}
              </Heading>
              {brand.description && (
                <Text className="text-xs text-ui-fg-subtle line-clamp-2 mt-1">
                  {brand.description}
                </Text>
              )}
            </LocalizedClientLink>
          ))}
        </div>
      )}
    </div>
  )
}
