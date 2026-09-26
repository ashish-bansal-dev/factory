"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  'data-testid'?: string
}

const RefinementList = ({ sortBy, 'data-testid': dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedMov, setSelectedMov] = useState<string | null>(searchParams.get("mov"))
  const [selectedMargin, setSelectedMargin] = useState<string | null>(searchParams.get("margin"))

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleMovChange = (mov: string) => {
    const nextVal = selectedMov === mov ? null : mov
    setSelectedMov(nextVal)
    const query = createQueryString("mov", nextVal)
    router.push(`${pathname}?${query}`)
  }

  const handleMarginChange = (margin: string) => {
    const nextVal = selectedMargin === margin ? null : margin
    setSelectedMargin(nextVal)
    const query = createQueryString("margin", nextVal)
    router.push(`${pathname}?${query}`)
  }

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <div className="flex flex-col gap-6 py-4 mb-8 sm:min-w-[260px] sm:mr-8 font-sans">
      {/* Sort Section */}
      <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-3">
          Sort By
        </span>
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
      </div>

      {/* Minimum Order Value (MOV) Filter (Indian Market) */}
      <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-3">
          Minimum Order (MOV)
        </span>
        <div className="flex flex-col gap-2 text-xs">
          {[
            { label: "Under ₹10,000", val: "10000" },
            { label: "₹10,000 – ₹25,000", val: "25000" },
            { label: "₹25,000 – ₹50,000", val: "50000" },
          ].map((item) => (
            <label
              key={item.val}
              className="flex items-center gap-2.5 text-stone-700 hover:text-charcoal-900 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedMov === item.val}
                onChange={() => handleMovChange(item.val)}
                className="w-4 h-4 rounded border-stone-300 text-charcoal-900 focus:ring-terracotta-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Margin Filter */}
      <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-3">
          Estimated Profit Margin
        </span>
        <div className="flex flex-col gap-2 text-xs">
          {[
            { label: "50%+ Retail Margin", val: "50" },
            { label: "60%+ High Margin Deals", val: "60" },
          ].map((item) => (
            <label
              key={item.val}
              className="flex items-center gap-2.5 text-stone-700 hover:text-charcoal-900 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedMargin === item.val}
                onChange={() => handleMarginChange(item.val)}
                className="w-4 h-4 rounded border-stone-300 text-charcoal-900 focus:ring-terracotta-500"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* B2B Trust Badge */}
      <div className="p-4 rounded-xl bg-sand-50 border border-stone-200 text-xs text-stone-600">
        <span className="font-semibold text-charcoal-900 block mb-1">
          Indian Wholesale Assurance
        </span>
        <p className="text-[11px] leading-relaxed text-stone-500">
          All suppliers are GST-verified manufacturers with guaranteed pack increments and official tax invoicing.
        </p>
      </div>
    </div>
  )
}

export default RefinementList
