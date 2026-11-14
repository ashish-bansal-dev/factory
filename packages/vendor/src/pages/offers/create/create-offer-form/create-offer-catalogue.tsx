import { HttpTypes } from "@medusajs/types"
import { Badge, Checkbox, Text, toast } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  ColumnDef,
  OnChangeFn,
  RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  isForbidden,
  mergeListFilters,
  SectionNoAccess,
  useExtendableTable,
} from "@mercurjs/dashboard-shared"

import {
  CategoryCell,
  CategoryHeader,
} from "../../../../components/table/table-cells/product/category-cell"
import {
  ProductCell,
  ProductHeader,
} from "../../../../components/table/table-cells/product/product-cell"
import {
  ProductStatusCell,
  ProductStatusHeader,
} from "../../../../components/table/table-cells/product/product-status-cell"
import { PlaceholderCell } from "../../../../components/table/table-cells/common/placeholder-cell"
import { _DataTable } from "../../../../components/table/data-table"
import { defineTabMeta } from "../../../../components/tabbed-form/types"
import { useProducts } from "../../../../hooks/api/products"
import { useCurrentSeller } from "../../../../hooks/api/sellers"
import { useProductTableFilters } from "../../../../hooks/table/filters/use-product-table-filters"
import { useProductTableQuery } from "../../../../hooks/table/query/use-product-table-query"
import { useDataTable } from "../../../../hooks/use-data-table"
import { CreateOfferFormValues } from "./schema"

const PAGE_SIZE = 10

const FIELDS = [
  "id",
  "title",
  "handle",
  "status",
  "thumbnail",
  "*collection",
  "categories.id",
  "categories.name",
  "variants.id",
].join(",")

type ProductRow = HttpTypes.AdminProduct

const Root = () => {
  const { t } = useTranslation()
  const form = useFormContext<CreateOfferFormValues>()
  const { seller } = useCurrentSeller()
  const isRetailer = seller?.type === "retailer"

  const channel = (useWatch({
    control: form.control,
    name: "channel",
  }) ?? "retail") as "retail" | "wholesale"

  const handleChannelChange = (newChannel: "retail" | "wholesale") => {
    if (newChannel === "wholesale" && isRetailer) {
      toast.error("Retailer accounts can only create retail offers.")
      return
    }
    form.setValue("channel", newChannel, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const initialSelection = (form.getValues("selected_product_ids") ?? []).reduce(
    (acc, id) => {
      acc[id] = true
      return acc
    },
    {} as RowSelectionState,
  )
  const [rowSelection, setRowSelection] =
    useState<RowSelectionState>(initialSelection)

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const next = typeof fn === "function" ? fn(rowSelection) : fn
    const nextIds = Object.keys(next)
    const currentIds = Object.keys(rowSelection)
    const unchanged =
      nextIds.length === currentIds.length &&
      nextIds.every((id) => rowSelection[id])

    if (unchanged) {
      return
    }

    setRowSelection(next)
    form.setValue("selected_product_ids", nextIds, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const { searchParams, raw } = useProductTableQuery({ pageSize: PAGE_SIZE })

  const { products, count, isLoading, isError, error } = useProducts(
    { ...searchParams, fields: FIELDS },
    { placeholderData: keepPreviousData },
  )

  const baseFilters = useProductTableFilters()
  const { columns, filters: extFilters } = useColumns()
  const filters = useMemo(
    () => mergeListFilters(baseFilters, extFilters),
    [baseFilters, extFilters],
  )

  const { table } = useDataTable({
    data: (products ?? []) as ProductRow[],
    columns,
    enablePagination: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    count,
    rowSelection: {
      state: rowSelection,
      updater,
    },
  })

  if (isError) {
    if (isForbidden(error)) {
      return <SectionNoAccess />
    }
    throw error
  }

  return (
    <div
      className="flex size-full flex-col"
      data-testid="offer-create-tab-catalogue"
    >
      <div className="flex flex-col gap-2 border-b border-ui-border-base bg-ui-bg-subtle/50 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <span className="text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider">
              Offer Type:
            </span>
            <div className="inline-flex rounded-lg border border-ui-border-base bg-ui-bg-base p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleChannelChange("retail")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  channel === "retail"
                    ? "bg-ui-bg-interactive text-ui-fg-on-color shadow-xs"
                    : "text-ui-fg-muted hover:text-ui-fg-base"
                }`}
                data-testid="offer-channel-retail-btn"
              >
                Retail Offer (Single Units)
              </button>
              <button
                type="button"
                disabled={isRetailer}
                onClick={() => handleChannelChange("wholesale")}
                title={isRetailer ? "Retailer accounts can only create retail offers." : undefined}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  channel === "wholesale"
                    ? "bg-ui-bg-interactive text-ui-fg-on-color shadow-xs"
                    : isRetailer
                    ? "text-ui-fg-disabled cursor-not-allowed opacity-50"
                    : "text-ui-fg-muted hover:text-ui-fg-base"
                }`}
                data-testid="offer-channel-wholesale-btn"
              >
                Wholesale Offer (Packs &amp; Tiered Pricing)
              </button>
            </div>
            {isRetailer && (
              <span className="text-[11px] text-ui-fg-muted italic">
                Retailer accounts can only create retail offers
              </span>
            )}
          </div>
          {channel === "wholesale" ? (
            <Badge color="purple" size="small">
              B2B Wholesale &bull; Pack Configuration Active
            </Badge>
          ) : (
            <Badge color="grey" size="small">
              B2C Retail &bull; Single Unit Sales Active
            </Badge>
          )}
        </div>
        <Text size="xsmall" className="text-ui-fg-muted">
          {channel === "wholesale"
            ? "Wholesale offers target B2B buyers with pack sizes, bulk pricing, and freight logistics."
            : "Retail offers target direct consumers on the marketplace with individual units."}
        </Text>
      </div>

      <_DataTable
        table={table}
        count={count}
        columns={columns}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        filters={filters}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrderBy="title"
        queryObject={raw}
        layout="fill"
        pagination
        search="autofocus"
      />
      <div className="bg-ui-bg-subtle border-t px-6 py-4">
        <p className="border-ui-border-strong txt-small text-ui-fg-subtle border-l-2 pl-3">
          <span className="text-ui-fg-base font-medium">
            {t("offers.create.tipLabel")}
          </span>{" "}
          {t("offers.create.tip")}
        </p>
      </div>
    </div>
  )
}

const columnHelper = createColumnHelper<ProductRow>()

const useColumns = () => {
  const { t } = useTranslation()

  const base = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            data-testid="offer-create-catalogue-select-all-checkbox"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => e.stopPropagation()}
            data-testid={`offer-create-catalogue-select-checkbox-${row.original.id}`}
          />
        ),
      }),
      columnHelper.display({
        id: "product",
        header: () => <ProductHeader />,
        cell: ({ row }) => (
          <ProductCell
            product={{
              title: row.original.title ?? "",
              thumbnail: row.original.thumbnail ?? null,
            }}
          />
        ),
      }),
      columnHelper.display({
        id: "categories",
        header: () => <CategoryHeader />,
        cell: ({ row }) => (
          <CategoryCell categories={row.original.categories} />
        ),
      }),
      columnHelper.display({
        id: "collection",
        header: t("fields.collection"),
        cell: ({ row }) => {
          const title = row.original.collection?.title
          if (!title) return <PlaceholderCell />
          return (
            <Text size="small" leading="compact" className="truncate">
              {title}
            </Text>
          )
        },
      }),
      columnHelper.display({
        id: "variants",
        header: t("offers.fields.variants"),
        cell: ({ row }) => (
          <Text size="small" leading="compact" className="truncate">
            {t("offers.fields.variantsCount", {
              count: row.original.variants?.length ?? 0,
            })}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "status",
        header: () => <ProductStatusHeader />,
        cell: ({ row }) => {
          const status = row.original.status
          if (!status) return <PlaceholderCell />
          return <ProductStatusCell status={status} />
        },
      }),
    ],
    [t],
  )

  const selectColumn = base[0]
  const { columns: extended, filters } = useExtendableTable<ProductRow>({
    model: "offer",
    zone: "create-catalogue",
    columns: base.slice(1) as unknown as ColumnDef<ProductRow, unknown>[],
  })

  const columns = useMemo(
    () => [selectColumn, ...extended] as ColumnDef<ProductRow, unknown>[],
    [selectColumn, extended],
  )

  return { columns, filters }
}

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "catalogue",
  labelKey: "offers.create.tabs.catalogue",
  validationFields: ["selected_product_ids"],
})

export const CreateOfferCatalogueTab = Root
