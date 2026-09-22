import { Phone, ArrowUpRightOnBox } from "@medusajs/icons"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { _DataTable } from "../../../../components/table/data-table"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useInquiries, type WholesaleInquiryDTO } from "../../../../hooks/api/inquiries"

const PAGE_SIZE = 20

export const InquiryListTitle = () => {
  return (
    <Heading level="h2" data-testid="inquiry-list-table-heading">
      Wholesale Inquiries
    </Heading>
  )
}

export const InquiryListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="inquiry-list-table-header"
    >
      {Children.count(children) > 0 ? children : <InquiryListTitle />}
    </div>
  )
}

const columnHelper = createColumnHelper<WholesaleInquiryDTO>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt", "Date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("store_name", {
        header: "Retailer Store",
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" weight="plus">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("contact_number", {
        header: "WhatsApp / Contact",
        cell: ({ getValue, row }) => {
          const number = getValue()
          const cleanPhone = number.replace(/\D/g, "")
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            `Hi ${row.original.store_name}, following up on your wholesale inquiry regarding product ${row.original.product_id}`
          )}`

          return (
            <div className="flex items-center gap-2">
              <Text size="small" leading="compact" className="font-mono">
                {number}
              </Text>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700"
                title="Chat on WhatsApp"
              >
                <ArrowUpRightOnBox className="h-4 w-4" />
              </a>
            </div>
          )
        },
      }),
      columnHelper.accessor("location", {
        header: "Location",
        cell: ({ getValue }) => (
          <Text size="small" leading="compact">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("product_id", {
        header: "Product / Variant",
        cell: ({ getValue, row }) => {
          const productId = getValue()
          const productTitle = (row.original.metadata?.product_title as string) || productId

          return (
            <div className="flex flex-col">
              <Link
                to={`/products/${productId}`}
                className="text-ui-fg-interactive hover:underline font-medium text-xs flex items-center gap-1"
                title="View Product Details"
              >
                <span>{productTitle}</span>
                <ArrowUpRightOnBox className="h-3 w-3 shrink-0" />
              </Link>
              {productTitle !== productId && (
                <Text size="xsmall" leading="compact" className="font-mono text-ui-fg-muted text-[10px]">
                  {productId}
                </Text>
              )}
              {row.original.variant_id && (
                <Text size="xsmall" leading="compact" className="text-ui-fg-muted text-[10px]">
                  Var: {row.original.variant_id}
                </Text>
              )}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "requirement",
        header: "Requirement",
        cell: ({ row }) => {
          const qty = row.original.metadata?.quantity
          const notes = row.original.metadata?.notes as string | undefined

          return (
            <div className="max-w-[200px] truncate">
              {qty ? (
                <Badge size="small" color="blue" className="mr-1">
                  Qty: {qty}
                </Badge>
              ) : null}
              {notes && (
                <Text size="xsmall" leading="compact" className="text-ui-fg-muted truncate">
                  {notes}
                </Text>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor("source_domain", {
        header: "Source",
        cell: ({ getValue }) => (
          <Badge size="small" color="grey">
            {getValue() || "factorytribe.com"}
          </Badge>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue()
          const colorMap: Record<string, "green" | "blue" | "grey"> = {
            new: "blue",
            contacted: "green",
            closed: "grey",
          }
          return (
            <Badge size="small" color={colorMap[status] || "grey"}>
              {status.toUpperCase()}
            </Badge>
          )
        },
      }),
    ],
    [t]
  )
}

export const InquiryListDataTable = () => {
  const { inquiries, count, isPending, isError, error } = useInquiries(
    {},
    { placeholderData: keepPreviousData }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: inquiries ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      pagination
      search
      navigateTo={undefined}
      isLoading={isPending}
      defaultOrder="-created_at"
      noRecords={{
        title: "No Wholesale Inquiries",
        message: "When retailers submit wholesale inquiries, they will appear here.",
        icon: <Phone />,
      }}
      noResults={{
        icon: <Phone />,
      }}
      data-testid="inquiry-list-table"
    />
  )
}

export const InquiryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="inquiry-list-table-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <InquiryListHeader />
          <InquiryListDataTable />
        </>
      )}
    </Container>
  )
}
