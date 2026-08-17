import { BrandDTO } from "@mercurjs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const BrandSellersSection = ({ brand }: { brand: BrandDTO }) => {
  const { t } = useTranslation()
  const sellers = brand.sellers ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Assigned Sellers</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Vendors authorized to sell products under this brand.
          </Text>
        </div>
      </div>

      {sellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Text size="small" className="text-ui-fg-muted">
            No sellers assigned to this brand yet.
          </Text>
        </div>
      ) : (
        <div className="divide-y">
          {sellers.map((seller: any) => (
            <div
              key={seller.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-ui-bg-subtle-hover"
            >
              <div className="flex flex-col">
                <Link
                  to={`/stores/${seller.id}`}
                  className="text-ui-fg-base font-medium hover:underline"
                >
                  {seller.name}
                </Link>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {seller.email}
                </Text>
              </div>
              {seller.type && (
                <Badge size="2xsmall" color="blue" className="capitalize">
                  {seller.type}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
