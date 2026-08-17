import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@medusajs/ui"
import { Thumbnail } from "../../../components/common/thumbnail"
import { TextCell } from "../../../components/table/table-cells/common/text-cell"
import { DateCell } from "../../../components/table/table-cells/common/date-cell"

const columnHelper = createColumnHelper<BrandDTO>()

export const useBrandTableColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("fields.name"),
        cell: ({ getValue, row }) => {
          const thumbnailSrc = row.original.logo ?? null

          return (
            <div className="flex size-full items-center gap-x-3 overflow-hidden">
              <Thumbnail src={thumbnailSrc} />
              <span className="truncate font-medium">{getValue()}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => <TextCell text={getValue() ? `/${getValue()}` : "-"} />,
      }),
      columnHelper.accessor("status", {
        header: t("fields.status"),
        cell: ({ getValue }) => {
          const status = getValue()
          const color =
            status === BrandStatus.APPROVED
              ? "green"
              : status === BrandStatus.PENDING_APPROVAL
              ? "orange"
              : "red"

          return (
            <Badge size="2xsmall" color={color} className="capitalize">
              {status?.replace(/_/g, " ")}
            </Badge>
          )
        },
      }),
      columnHelper.accessor("sellers", {
        header: "Sellers",
        cell: ({ getValue }) => {
          const count = getValue()?.length ?? 0
          return <TextCell text={count > 0 ? `${count} seller${count > 1 ? "s" : ""}` : "-"} />
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
    ],
    [t]
  )
}
