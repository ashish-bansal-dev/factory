import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"
import { useDateTableFilters } from "./use-date-table-filters"
import { BrandStatus } from "@mercurjs/types"

export const useBrandTableFilters = (): Filter[] => {
  const { t } = useTranslation()
  const dateFilters = useDateTableFilters()

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: [
      {
        label: "Approved",
        value: BrandStatus.APPROVED,
      },
      {
        label: "Pending Approval",
        value: BrandStatus.PENDING_APPROVAL,
      },
      {
        label: "Rejected",
        value: BrandStatus.REJECTED,
      },
    ],
  }

  return [statusFilter, ...dateFilters]
}
