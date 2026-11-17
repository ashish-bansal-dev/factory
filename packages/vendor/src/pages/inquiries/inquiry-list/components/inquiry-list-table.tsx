import { Phone, ArrowUpRightOnBox, Eye } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { _DataTable } from "../../../../components/table/data-table"
import { DateCell } from "../../../../components/table/table-cells/common/date-cell"
import { useDataTable } from "../../../../hooks/use-data-table"
import { useVendorInquiries, type VendorInquiryDTO } from "../../../../hooks/api/inquiries"
import { CreateDraftOrderModal } from "./create-draft-order-modal"
import {
  VendorInquiryDetailDrawer,
  type GroupedVendorInquiry,
} from "./vendor-inquiry-detail-drawer"

const PAGE_SIZE = 20

export const VendorInquiryListTitle = () => {
  return (
    <Heading level="h2" data-testid="vendor-inquiry-list-table-heading">
      Wholesale Inquiries
    </Heading>
  )
}

export const VendorInquiryListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="vendor-inquiry-list-table-header"
    >
      {Children.count(children) > 0 ? children : <VendorInquiryListTitle />}
    </div>
  )
}

export const groupVendorInquiries = (
  inquiries: VendorInquiryDTO[]
): GroupedVendorInquiry[] => {
  const groupsMap = new Map<string, VendorInquiryDTO[]>()

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

  const result: GroupedVendorInquiry[] = []

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
      sourceDomain: first.source_domain || "Your Branded Store",
      status: aggregatedStatus,
      totalUnits,
      itemCount: items.length,
      items,
    })
  }

  return result
}

const columnHelper = createColumnHelper<GroupedVendorInquiry>()

const useColumns = (
  onOpenDrawer: (inquiry: GroupedVendorInquiry) => void,
  onOpenDraftOrder: (item: VendorInquiryDTO) => void
) => {
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
              {isShowroom ? `Showroom: ${domain}` : "Marketplace Hub"}
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
          const inq = row.original
          const isSingle = inq.items.length === 1
          const singleItem = inq.items[0]
          const isConverted = inq.status === "converted"

          return (
            <div className="flex items-center gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => onOpenDrawer(inq)}
                className="flex items-center gap-1 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </Button>
              {isSingle && !isConverted && (
                <Button
                  size="small"
                  variant="primary"
                  onClick={() => onOpenDraftOrder(singleItem)}
                  className="text-xs"
                >
                  Create Draft Order
                </Button>
              )}
            </div>
          )
        },
      }),
    ],
    [t, onOpenDrawer, onOpenDraftOrder]
  )
}

export const VendorInquiryListDataTable = () => {
  const { inquiries, count, isPending, isError, error } = useVendorInquiries(
    {},
    { placeholderData: keepPreviousData }
  )

  const [selectedDrawerInquiry, setSelectedDrawerInquiry] =
    useState<GroupedVendorInquiry | null>(null)
  const [selectedDraftOrderItem, setSelectedDraftOrderItem] =
    useState<VendorInquiryDTO | null>(null)

  const groupedData = useMemo(() => groupVendorInquiries(inquiries ?? []), [inquiries])

  const columns = useColumns(
    (inquiry) => setSelectedDrawerInquiry(inquiry),
    (item) => setSelectedDraftOrderItem(item)
  )

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
          message: "When buyers submit inquiries for your brand, they will appear here.",
          icon: <Phone />,
        }}
        noResults={{
          icon: <Phone />,
        }}
        data-testid="vendor-inquiry-list-table"
      />

      <VendorInquiryDetailDrawer
        open={Boolean(selectedDrawerInquiry)}
        onOpenChange={(open) => {
          if (!open) setSelectedDrawerInquiry(null)
        }}
        inquiry={selectedDrawerInquiry}
        onConvertItem={(item) => setSelectedDraftOrderItem(item)}
      />

      {selectedDraftOrderItem && (
        <CreateDraftOrderModal
          inquiry={selectedDraftOrderItem}
          open={Boolean(selectedDraftOrderItem)}
          onOpenChange={(open) => {
            if (!open) setSelectedDraftOrderItem(null)
          }}
        />
      )}
    </>
  )
}

export const VendorInquiryListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="vendor-inquiry-list-table-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <VendorInquiryListHeader />
          <VendorInquiryListDataTable />
        </>
      )}
    </Container>
  )
}
