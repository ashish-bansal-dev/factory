import { Phone, ArrowUpRightOnBox, Eye } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../components/table/data-table"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useInquiries, type WholesaleInquiryDTO } from "../../../../hooks/api/inquiries"
import { InquiryDetailDrawer, type GroupedInquiry } from "./inquiry-detail-drawer"

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

export const groupInquiries = (inquiries: WholesaleInquiryDTO[]): GroupedInquiry[] => {
  const groupsMap = new Map<string, WholesaleInquiryDTO[]>()

  for (const inquiry of inquiries) {
    const batchId = (inquiry.metadata?.batch_id as string) || null
    const key = batchId || inquiry.id
    const existing = groupsMap.get(key)
    if (existing) {
      existing.push(inquiry)
    } else {
      groupsMap.set(key, [inquiry])
    }
  }

  const result: GroupedInquiry[] = []

  for (const [key, items] of groupsMap.entries()) {
    const first = items[0]
    const batchId = (first.metadata?.batch_id as string) || null

    let totalUnits = 0
    let hasNew = false
    let hasContacted = false
    let allConverted = true

    for (const it of items) {
      const q = Number(it.metadata?.quantity) || 1
      totalUnits += q
      if (it.status === "new") hasNew = true
      if (it.status === "contacted") hasContacted = true
      if (it.status !== "converted") allConverted = false
    }

    const aggregatedStatus = hasNew
      ? "new"
      : hasContacted
      ? "contacted"
      : allConverted
      ? "converted"
      : first.status

    result.push({
      id: key,
      batchId,
      createdAt: first.created_at,
      storeName: first.store_name,
      contactNumber: first.contact_number,
      location: first.location,
      sourceDomain: first.source_domain || "factorytribe.com",
      status: aggregatedStatus,
      totalUnits,
      itemCount: items.length,
      items,
    })
  }

  return result
}

const columnHelper = createColumnHelper<GroupedInquiry>()

const useColumns = (onSelectInquiry: (inquiry: GroupedInquiry) => void) => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("createdAt", {
        header: t("fields.createdAt", "Date"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.accessor("storeName", {
        header: "Retailer Store",
        cell: ({ getValue }) => (
          <Text size="small" leading="compact" weight="plus">
            {getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor("contactNumber", {
        header: "WhatsApp / Contact",
        cell: ({ getValue, row }) => {
          const number = getValue()
          const cleanPhone = number.replace(/\D/g, "")
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            `Hi ${row.original.storeName}, following up on your wholesale inquiry for ${row.original.itemCount} products.`
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
      columnHelper.accessor("sourceDomain", {
        header: "Showroom Source",
        cell: ({ getValue }) => {
          const domain = getValue()
          const isShowroom =
            Boolean(domain) &&
            !domain.includes("factorytribe.com") &&
            domain !== "factorytribe.com"

          return (
            <Badge size="small" color={isShowroom ? "purple" : "grey"}>
              {isShowroom ? `Showroom: ${domain}` : "factorytribe.com"}
            </Badge>
          )
        },
      }),
      columnHelper.display({
        id: "items",
        header: "Items Requested",
        cell: ({ row }) => {
          const inq = row.original
          const firstProductTitle =
            (inq.items[0]?.metadata?.product_title as string) ||
            inq.items[0]?.product_id ||
            "Product"

          return (
            <div className="flex flex-col gap-0.5 max-w-[240px]">
              <div className="flex items-center gap-1.5">
                <Badge size="small" color="blue" className="font-semibold">
                  {inq.itemCount} {inq.itemCount === 1 ? "Product" : "Products"}
                </Badge>
                <Text size="xsmall" className="text-ui-fg-muted font-medium">
                  {inq.totalUnits} pcs
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle truncate text-[11px]">
                {firstProductTitle}
                {inq.itemCount > 1 ? ` + ${inq.itemCount - 1} more` : ""}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue()
          const colorMap: Record<string, "green" | "blue" | "grey"> = {
            new: "blue",
            contacted: "green",
            converted: "green",
            closed: "grey",
          }
          return (
            <Badge size="small" color={colorMap[status] || "grey"}>
              {status.toUpperCase()}
            </Badge>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <Button
              size="small"
              variant="secondary"
              onClick={() => onSelectInquiry(row.original)}
              className="flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </Button>
          )
        },
      }),
    ],
    [t, onSelectInquiry]
  )
}

export const InquiryListDataTable = () => {
  const { inquiries, count, isPending, isError, error } = useInquiries(
    {},
    { placeholderData: keepPreviousData }
  )

  const [selectedInquiry, setSelectedInquiry] = useState<GroupedInquiry | null>(null)
  const groupedData = useMemo(() => groupInquiries(inquiries ?? []), [inquiries])
  const columns = useColumns(setSelectedInquiry)

  const { table } = useDataTable({
    data: groupedData,
    columns,
    count: groupedData.length,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <>
      <_DataTable
        table={table}
        columns={columns}
        count={groupedData.length}
        pageSize={PAGE_SIZE}
        pagination
        search
        navigateTo={undefined}
        isLoading={isPending}
        defaultOrder="-createdAt"
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
      <InquiryDetailDrawer
        open={Boolean(selectedInquiry)}
        onOpenChange={(open) => {
          if (!open) setSelectedInquiry(null)
        }}
        inquiry={selectedInquiry}
      />
    </>
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
