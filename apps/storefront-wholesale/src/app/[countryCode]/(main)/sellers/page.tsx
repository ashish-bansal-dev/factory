import { Metadata } from "next"
import { listSellers } from "@lib/data/seller"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text, Badge } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Wholesale Suppliers & Manufacturers",
  description: "Browse verified wholesale suppliers, manufacturers, and brand distributors.",
}

export default async function SellersPage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { countryCode: _countryCode } = await props.params
  const { q } = await props.searchParams

  const { sellers, count } = await listSellers({ q })

  return (
    <div className="content-container py-12">
      <div className="flex flex-col gap-y-4 mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Heading level="h1" className="text-3xl font-semibold">
              Wholesale Suppliers & Sellers
            </Heading>
            <Text className="text-ui-fg-subtle text-base mt-1">
              Direct access to {count} verified wholesale manufacturers and distributors
            </Text>
          </div>
        </div>

        {/* Search Bar */}
        <form method="GET" className="max-w-md mt-4">
          <input
            type="search"
            name="q"
            defaultValue={q || ""}
            aria-label="Search suppliers by name"
            placeholder="Search suppliers by name..."
            className="w-full px-4 py-2 text-sm border rounded-lg border-ui-border-base focus:outline-none focus:ring-2 focus:ring-ui-fg-interactive"
          />
        </form>
      </div>

      {sellers.length === 0 ? (
        <div className="text-center py-16 bg-ui-bg-subtle rounded-xl">
          <Text className="text-ui-fg-muted">
            No wholesale suppliers found matching your query.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="border border-ui-border-base rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col justify-between bg-ui-bg-base"
            >
              <div>
                {/* Banner */}
                <div className="h-28 bg-gradient-to-r from-ui-bg-subtle to-ui-bg-subtle-hover relative">
                  {seller.banner && (
                    <img
                      src={seller.banner}
                      alt={seller.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {seller.is_premium && (
                    <div className="absolute top-3 right-3">
                      <Badge color="orange">Verified Supplier</Badge>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Logo + Name */}
                  <div className="flex items-center gap-x-4 mb-3">
                    <div className="w-14 h-14 rounded-full border-2 border-white -mt-10 bg-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-lg text-ui-fg-base">
                      {seller.logo ? (
                        <img
                          src={seller.logo}
                          alt={seller.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        seller.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <Heading level="h2" className="text-lg font-medium">
                        {seller.name}
                      </Heading>
                      <Text className="text-xs text-ui-fg-muted">
                        @{seller.handle}
                      </Text>
                    </div>
                  </div>

                  <Text className="text-sm text-ui-fg-subtle line-clamp-3 mb-4">
                    {seller.description || "Verified wholesale distributor."}
                  </Text>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-ui-border-base/50 flex items-center justify-between mt-auto">
                <LocalizedClientLink
                  href={`/sellers/${seller.handle}`}
                  className="text-sm font-medium text-ui-fg-interactive hover:underline"
                >
                  View Wholesale Catalog &rarr;
                </LocalizedClientLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
