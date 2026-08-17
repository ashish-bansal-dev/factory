import { Container } from "@medusajs/ui"
import { BrandListDataTable } from "./brand-list-data-table"
import { BrandListHeader } from "./brand-list-header"

export const BrandListTable = () => {
  return (
    <Container className="divide-y p-0">
      <BrandListHeader />
      <BrandListDataTable />
    </Container>
  )
}
