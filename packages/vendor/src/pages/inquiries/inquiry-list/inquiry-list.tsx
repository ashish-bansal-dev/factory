import { Children, ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
import {
  VendorInquiryListDataTable,
  VendorInquiryListHeader,
  VendorInquiryListTable,
  VendorInquiryListTitle,
} from "./components/inquiry-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <VendorInquiryListTable />}
    </SingleColumnPage>
  )
}

export const VendorInquiryListPage = Object.assign(Root, {
  Table: VendorInquiryListTable,
  Header: VendorInquiryListHeader,
  HeaderTitle: VendorInquiryListTitle,
  DataTable: VendorInquiryListDataTable,
})
