"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { InstantSearch, useSearchBox, useHits, useInstantSearch } from "react-instantsearch"
import clsx from "clsx"

import { Input } from "@/components/atoms/Input/Input"
import { SearchIcon } from "@/icons"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { searchClient, PRODUCT_INDEX_NAME } from "@/lib/search-client"

export type ProductHit = {
  id: string
  title: string
  description?: string
  handle: string
  thumbnail?: string | null
  categories?: string[]
  labels?: string[]
  seller_ids?: string[]
  created_at?: string
}

interface Props {
  className?: string
}

export const NavbarSearch = ({ className }: Props) => {
  return (
    <div className={clsx("relative w-full", className)}>
      <InstantSearch searchClient={searchClient} indexName={PRODUCT_INDEX_NAME}>
        <NavbarSearchInner />
      </InstantSearch>
    </div>
  )
}

const NavbarSearchInner = () => {
  const { query, refine } = useSearchBox()
  const { hits } = useHits<ProductHit>()
  const { status, results, error } = useInstantSearch()

  const [inputValue, setInputValue] = useState(query || "")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      refine(inputValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue, refine])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const hasInput = inputValue.trim().length > 0
  const resultsQuery = results?.query?.trim() ?? ""

  // Step 8 gate: If the user has typed a query, but the visible results were fetched
  // for an empty query, do not display those results because that would flash the
  // entire catalog. Only gate on this specific case.
  const isStaleEmptyResults = hasInput && !resultsQuery

  // Step 9: In-flight loading indicator only when there's nothing valid to show yet
  const isInitialLoading = (status === "loading" || status === "stalled") && (isStaleEmptyResults || !results)

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <Input
        icon={<SearchIcon />}
        placeholder="Search products..."
        value={inputValue}
        changeValue={(val) => {
          setInputValue(val)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        type="search"
        clearable
        data-testid="search-input"
      />

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-stone-200 rounded-md shadow-lg max-h-96 overflow-y-auto"
          data-testid="search-results-dropdown"
        >
          {error ? (
            <div className="p-4 text-sm text-red-500" data-testid="search-error">
              Search error: {error.message || "Failed to load search results."}
            </div>
          ) : !hasInput ? (
            <div className="p-4 text-sm text-stone-500 text-center" data-testid="search-empty-prompt">
              Type to search products...
            </div>
          ) : isInitialLoading ? (
            <div className="p-6 flex items-center justify-center text-sm text-stone-400 gap-2" data-testid="search-loading">
              <span className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              Searching...
            </div>
          ) : !isStaleEmptyResults && hits.length === 0 && status !== "loading" ? (
            <div className="p-4 text-sm text-stone-500 text-center" data-testid="search-no-results">
              No products found matching &quot;{inputValue}&quot;
            </div>
          ) : (
            <div className="py-2 divide-y divide-stone-100" data-testid="search-hits-list">
              {hits.map((hit) => (
                <LocalizedClientLink
                  key={hit.id}
                  href={`/products/${hit.handle}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors"
                  data-testid="search-hit-item"
                >
                  <div className="w-12 h-12 relative flex-shrink-0 bg-stone-100 rounded overflow-hidden">
                    {hit.thumbnail ? (
                      <Image
                        src={hit.thumbnail}
                        alt={hit.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">{hit.title}</p>
                    {hit.categories && hit.categories.length > 0 && (
                      <p className="text-xs text-stone-500 truncate">{hit.categories.join(", ")}</p>
                    )}
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
