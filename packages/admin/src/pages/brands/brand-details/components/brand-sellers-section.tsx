import { BrandDTO } from "@mercurjs/types"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { ArrowUpRightOnBox, BuildingStorefront } from "@medusajs/icons"
import { Link } from "react-router-dom"
import { Thumbnail } from "@components/common/thumbnail"

export const BrandSellersSection = ({ brand }: { brand: BrandDTO }) => {
  const sellers = brand.sellers ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-x-2">
            <Heading level="h2">Authorized Sellers</Heading>
            <Badge size="2xsmall" color="grey">
              {sellers.length}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            Vendors authorized to sell and manage products under this brand.
          </Text>
        </div>
      </div>

      {sellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-y-2 p-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-ui-bg-subtle text-ui-fg-muted">
            <BuildingStorefront className="size-5" />
          </div>
          <Text size="small" weight="plus" className="text-ui-fg-base">
            No sellers assigned
          </Text>
          <Text size="small" className="text-ui-fg-muted max-w-sm">
            No vendors are currently authorized to sell under this brand.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {sellers.map((seller: any) => (
            <div
              key={seller.id}
              className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-ui-bg-subtle-hover"
            >
              <div className="flex items-center gap-x-4 overflow-hidden">
                {seller.logo ? (
                  <Thumbnail src={seller.logo} size="base" />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-lg border border-ui-border-base bg-ui-bg-subtle text-ui-fg-muted shrink-0">
                    <BuildingStorefront className="size-4" />
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-x-2">
                    <Link
                      to={`/stores/${seller.id}`}
                      className="truncate text-ui-fg-base font-medium hover:underline text-sm"
                    >
                      {seller.name}
                    </Link>
                    {seller.type && (
                      <Badge size="2xsmall" color="blue" className="capitalize shrink-0">
                        {seller.type}
                      </Badge>
                    )}
                    {seller.status && (
                      <Badge
                        size="2xsmall"
                        color={seller.status === "open" ? "green" : "grey"}
                        className="capitalize shrink-0"
                      >
                        {seller.status}
                      </Badge>
                    )}
                  </div>
                  <Text size="xsmall" className="text-ui-fg-subtle truncate">
                    {seller.email}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-x-2 shrink-0">
                <Button size="small" variant="secondary" asChild>
                  <Link to={`/stores/${seller.id}`}>
                    View Store
                    <ArrowUpRightOnBox className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
