"use client"

import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"

import { Chip } from '@/components/atoms/Chip/Chip';
import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { isRetailVariant } from "@/lib/helpers/variant-filter"

export const ProductVariants = ({
  product,
  selectedVariant,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant: Record<string, string>
}) => {
  const updateSearchParams = useUpdateSearchParams()

  const setOptionValue = (optionId: string, value: string) => {
    if (value) updateSearchParams(optionId, value)
  }

  // Filter variants to retail-only (single piece, not wholesale)
  const retailVariants = useMemo(() => {
    return (product.variants || []).filter(isRetailVariant)
  }, [product.variants])

  const allowedValuesByTitle = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const v of retailVariants) {
      for (const opt of v.options || []) {
        const title = opt.option?.title?.toLowerCase()
        if (title && opt.value) {
          if (!map[title]) map[title] = new Set()
          map[title].add(opt.value)
        }
      }
    }
    return map
  }, [retailVariants])

  const validOptions = useMemo(() => {
    return (product.options || [])
      .map((opt) => {
        const titleKey = (opt.title || "").toLowerCase()
        const allowedSet = allowedValuesByTitle[titleKey]
        const filteredValues = allowedSet
          ? (opt.values || []).filter((v) => v.value && allowedSet.has(v.value))
          : opt.values || []
        return {
          ...opt,
          values: filteredValues,
        }
      })
      .filter((opt) => (opt.values?.length ?? 0) > 0)
  }, [product.options, allowedValuesByTitle])

  return (
    <div className="my-4 space-y-2" data-testid="product-variants">
      {validOptions.map(
        ({ id, title, values }: HttpTypes.StoreProductOption) => (
          <div key={id} data-testid={`product-variant-${title.toLowerCase()}`}>
            <span className="label-md text-secondary">{title}: </span>
            <span className="label-md text-primary" data-testid={`product-variant-selected-${title.toLowerCase()}`}>
              {selectedVariant[title.toLowerCase()]}
            </span>
            <div className="flex gap-2 mt-2" data-testid={`product-variant-options-${title.toLowerCase()}`}>
              {(values || []).map(
                ({
                  id,
                  value,
                }: Partial<HttpTypes.StoreProductOptionValue>) => (
                  <Chip
                    key={id}
                    selected={selectedVariant[title.toLowerCase()] === value}
                    color={title === "Color"}
                    value={value}
                    onSelect={() =>
                      setOptionValue(title.toLowerCase(), value || "")
                    }
                    data-testid={`product-variant-chip-${title.toLowerCase()}-${value?.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                )
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
