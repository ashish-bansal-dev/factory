import { BrandDTO } from "@mercurjs/types"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { ArrowUpRightOnBox, SquareTwoStack } from "@medusajs/icons"
import { Link } from "react-router-dom"
import { Thumbnail } from "@components/common/thumbnail"

export const BrandProductsSection = ({ brand }: { brand: BrandDTO }) => {
  const products = brand.products ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <div className="flex items-center gap-x-2">
            <Heading level="h2">Assigned Products</Heading>
            <Badge size="2xsmall" color="grey">
              {products.length}
            </Badge>
          </div>
          <Text size="small" className="text-ui-fg-subtle">
            Products cataloged under this brand across all authorized sellers.
          </Text>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-y-2 p-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-ui-bg-subtle text-ui-fg-muted">
            <SquareTwoStack className="size-5" />
          </div>
          <Text size="small" weight="plus" className="text-ui-fg-base">
            No products assigned
          </Text>
          <Text size="small" className="text-ui-fg-muted max-w-sm">
            Products assigned to this brand during product creation or organization will appear here.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {products.map((product: any) => {
            const statusColor =
              product.status === "published"
                ? "green"
                : product.status === "proposed"
                ? "orange"
                : "grey"

            return (
              <div
                key={product.id}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-ui-bg-subtle-hover"
              >
                <div className="flex items-center gap-x-4 overflow-hidden">
                  <Thumbnail src={product.thumbnail ?? null} size="base" />
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-x-2">
                      <Link
                        to={`/products/${product.id}`}
                        className="truncate text-ui-fg-base font-medium hover:underline text-sm"
                      >
                        {product.title}
                      </Link>
                      <Badge size="2xsmall" color={statusColor} className="capitalize shrink-0">
                        {product.status?.replace(/_/g, " ") ?? "draft"}
                      </Badge>
                    </div>
                    <Text size="xsmall" className="text-ui-fg-subtle font-mono truncate">
                      {product.handle ? `/${product.handle}` : product.id}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-x-2 shrink-0">
                  <Button size="small" variant="secondary" asChild>
                    <Link to={`/products/${product.id}`}>
                      View Product
                      <ArrowUpRightOnBox className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
