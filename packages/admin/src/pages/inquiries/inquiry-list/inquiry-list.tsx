import { Children, ReactNode } from "react"
import { SingleColumnPage } from "../../../components/layout/pages"
import {
  InquiryListDataTable,
  InquiryListHeader,
  InquiryListTable,
  InquiryListTitle,
} from "./components/inquiry-list-table"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage hasOutlet>
      {Children.count(children) > 0 ? children : <InquiryListTable />}
    </SingleColumnPage>
  )
}

export const InquiryListPage = Object.assign(Root, {
  Table: InquiryListTable,
  Header: InquiryListHeader,
  HeaderTitle: InquiryListTitle,
  DataTable: InquiryListDataTable,
})
