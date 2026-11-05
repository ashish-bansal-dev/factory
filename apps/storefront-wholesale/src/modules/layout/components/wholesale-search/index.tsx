"use client"

import { useState, useEffect, useRef } from "react"
import { Configure, InstantSearch, useSearchBox, useHits, useInstantSearch } from "react-instantsearch"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { searchClient, PRODUCT_INDEX_NAME } from "@lib/search-client"

export type WholesaleProductHit = {
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

interface WholesaleNavbarSearchProps {
  sellerId?: string | null
  sellerName?: string | null
}

export default function WholesaleNavbarSearch({
  sellerId,
  sellerName,
}: WholesaleNavbarSearchProps) {
  return (
    <div className="relative w-full">
      <InstantSearch searchClient={searchClient} indexName={PRODUCT_INDEX_NAME}>
        {sellerId && (
          <Configure facetFilters={[`seller_ids:${sellerId}`]} />
        )}
        <WholesaleNavbarSearchInner sellerName={sellerName} />
      </InstantSearch>
    </div>
  )
}

function WholesaleNavbarSearchInner({ sellerName }: { sellerName?: string | null }) {
  const { query, refine } = useSearchBox()
  const { hits } = useHits<WholesaleProductHit>()
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
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-stone-400 pointer-events-none">
          <MagnifyingGlass className="w-4 h-4" />
        </span>
        <input
          type="search"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={
            sellerName
              ? `Search ${sellerName} products...`
              : "Search wholesale products, brands..."
          }
          className="w-full pl-10 pr-9 py-2 text-sm bg-sand-50/70 hover:bg-sand-50 focus:bg-white border border-stone-200 rounded-full text-charcoal-900 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all duration-150"
          data-testid="wholesale-search-input"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("")
              refine("")
            }}
            className="absolute right-3 text-stone-400 hover:text-stone-600 transition"
            aria-label="Clear search"
          >
            <XMark className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-stone-200/90 rounded-2xl shadow-xl max-h-96 overflow-y-auto"
          data-testid="wholesale-search-dropdown"
        >
          {error ? (
            <div className="p-4 text-sm text-red-600" data-testid="wholesale-search-error">
              Search error: {error.message || "Failed to load wholesale search results."}
            </div>
          ) : !hasInput ? (
            <div className="p-5 text-sm text-stone-500 text-center" data-testid="wholesale-search-prompt">
              Type to search wholesale catalog...
            </div>
          ) : isInitialLoading ? (
            <div className="p-6 flex items-center justify-center text-sm text-stone-400 gap-2.5" data-testid="wholesale-search-loading">
              <span className="w-4 h-4 border-2 border-terracotta-300 border-t-terracotta-600 rounded-full animate-spin" />
              Searching catalog...
            </div>
          ) : !isStaleEmptyResults && hits.length === 0 && status !== "loading" ? (
            <div className="p-5 text-sm text-stone-500 text-center" data-testid="wholesale-search-no-results">
              No products found matching &quot;{inputValue}&quot;
            </div>
          ) : (
            <div className="py-2 divide-y divide-stone-100" data-testid="wholesale-search-hits">
              {hits.map((hit) => (
                <LocalizedClientLink
                  key={hit.id}
                  href={`/products/${hit.handle}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-3 hover:bg-sand-50/80 transition-colors"
                  data-testid="wholesale-search-hit-item"
                >
                  <div className="w-12 h-12 relative flex-shrink-0 bg-sand-100 rounded-lg overflow-hidden border border-stone-200/60">
                    {hit.thumbnail ? (
                      <img
                        src={hit.thumbnail}
                        alt={hit.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-medium">
                        B2B
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 truncate">{hit.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {hit.categories && hit.categories.length > 0 && (
                        <span className="text-xs text-stone-500 truncate">
                          {hit.categories[0]}
                        </span>
                      )}
                      {hit.labels && hit.labels.length > 0 && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sand-100 text-stone-600 border border-stone-200">
                          {hit.labels[0]}
                        </span>
                      )}
                    </div>
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
