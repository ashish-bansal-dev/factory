import { ReactNode, Children } from "react"
import { WidgetZone } from "@mercurjs/dashboard-shared"
import { SingleColumnPage } from "@components/layout/pages"
import {
  BrandListTable,
  BrandListDataTable,
  BrandListHeader,
  BrandListActions,
  BrandListTitle,
} from "./components/brand-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="brands.list">
        {Children.count(children) > 0 ? children : <BrandListTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const BrandListPage = Object.assign(Root, {
  Table: BrandListTable,
  Header: BrandListHeader,
  HeaderTitle: BrandListTitle,
  HeaderActions: BrandListActions,
  DataTable: BrandListDataTable,
})
