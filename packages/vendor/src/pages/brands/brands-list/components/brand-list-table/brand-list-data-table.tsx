import { BrandDTO } from "@mercurjs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { useExtendableTable } from "@mercurjs/dashboard-shared"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { _DataTable } from "@components/table/data-table"
import { useBrands } from "@hooks/api/brands"
import { useBrandTableColumns } from "@hooks/table/columns/use-brand-table-columns"
import { useBrandTableFilters } from "@hooks/table/filters/use-brand-table-filters"
import { useDataTable } from "@hooks/use-data-table"
import { useQueryParams } from "@hooks/use-query-params"

const PAGE_SIZE = 20

export const BrandListDataTable = () => {
  const { t } = useTranslation()
  const raw = useQueryParams(["q", "status", "created_at", "updated_at", "offset", "order"])
  const { offset, order, ...rest } = raw
  const searchParams = {
    ...rest,
    offset: offset ? Number(offset) : 0,
    limit: PAGE_SIZE,
    order: order ? (order as string) : undefined,
  }

  const { brands, count, isError, error, isLoading } = useBrands(
    searchParams,
    {
      placeholderData: keepPreviousData,
    }
  )

  const baseFilters = useBrandTableFilters()
  const { columns, filters: extFilters } = useColumns()
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters ?? [])],
    [baseFilters, extFilters]
  )

  const { table } = useDataTable({
    data: (brands as BrandDTO[]) ?? [],
    columns,
    count,
    enablePagination: true,
    getRowId: (row, index) => row.id ?? `${index}`,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      pageSize={PAGE_SIZE}
      count={count}
      filters={filters}
      orderBy={[
        { key: "name", label: t("fields.name") },
        { key: "handle", label: t("fields.handle") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      search
      queryObject={raw}
      isLoading={isLoading}
    />
  )
}

const useColumns = () => {
  const base = useBrandTableColumns()
  const { columns, filters } = useExtendableTable<BrandDTO>({
    model: "brand",
    columns: base as any,
  })

  return { columns, filters }
}
