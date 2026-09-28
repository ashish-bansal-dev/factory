import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"
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
          const description = row.original.description

          return (
            <div className="flex size-full items-center gap-x-3 overflow-hidden py-1">
              <Thumbnail src={thumbnailSrc} size="base" />
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-medium text-ui-fg-base text-sm">
                  {getValue()}
                </span>
                {description && (
                  <span className="truncate text-xs text-ui-fg-subtle max-w-[240px]">
                    {description}
                  </span>
                )}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => {
          const handle = getValue()
          return (
            <span className="font-mono text-xs text-ui-fg-subtle">
              {handle ? `/${handle}` : "-"}
            </span>
          )
        },
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
      columnHelper.accessor("products", {
        header: "Products",
        cell: ({ getValue }) => {
          const count = getValue()?.length ?? 0
          return (
            <TextCell
              text={count > 0 ? `${count} product${count > 1 ? "s" : ""}` : "0 products"}
            />
          )
        },
      }),
      columnHelper.accessor("website_url", {
        header: t("fields.website"),
        cell: ({ getValue }) => {
          const url = getValue()
          if (!url) return <TextCell text="-" />

          return (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-x-1 text-xs text-ui-fg-interactive hover:underline"
            >
              <span className="truncate max-w-[140px]">{url.replace(/^https?:\/\//, "")}</span>
              <ArrowUpRightOnBox className="size-3 shrink-0" />
            </a>
          )
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
