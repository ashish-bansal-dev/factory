"use client"

import React, { useState, useRef, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

interface NestedCategoriesMenuProps {
  categories: HttpTypes.StoreProductCategory[]
}

export default function NestedCategoriesMenu({ categories }: NestedCategoriesMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Safe array handling
  const safeCategories = Array.isArray(categories) ? categories : []
  // Root categories have no parent_category or parent_category_id
  const topCategories = safeCategories.filter((c) => !c.parent_category && !c.parent_category_id)

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    topCategories[0]?.id || ""
  )

  useEffect(() => {
    if (!activeCategoryId && topCategories.length > 0) {
      setActiveCategoryId(topCategories[0].id)
    }
  }, [topCategories, activeCategoryId])

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 250) // Grace period to prevent accidental closing
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const activeCategory = safeCategories.find((c) => c.id === activeCategoryId) || topCategories[0]

  return (
    <div
      ref={menuRef}
      className="relative font-sans"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1 hover:text-terracotta-600 transition text-sm font-medium text-stone-700 py-2 focus:outline-none"
        aria-expanded={isOpen}
      >
        <span>Categories</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Flyout Panel with zero-gap hover bridge */}
      {isOpen && (
        <div
          className="absolute top-full left-0 pt-1 z-50 w-[680px] animate-in fade-in slide-in-from-top-1 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="rounded-2xl bg-white border border-stone-200 shadow-2xl p-5 overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <span className="font-serif text-sm font-bold text-charcoal-900">
                Wholesale Categories & Departments
              </span>
              <LocalizedClientLink
                href="/categories"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-terracotta-600 hover:underline"
              >
                Browse All Categories &rarr;
              </LocalizedClientLink>
            </div>

            {/* Split View for Deep Multi-Level Nesting */}
            <div className="grid grid-cols-[220px_1fr] gap-4 min-h-[320px] max-h-[460px]">
              {/* Level 1: Root Categories Sidebar */}
              <div className="border-r border-stone-100 pr-2 overflow-y-auto no-scrollbar space-y-1">
                {topCategories.map((cat) => {
                  const isSelected = cat.id === activeCategory?.id
                  const childCount = cat.category_children?.length || 0
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onMouseEnter={() => setActiveCategoryId(cat.id)}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-sand-100 text-charcoal-900 font-bold"
                          : "text-stone-600 hover:bg-stone-50 hover:text-charcoal-900"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {childCount > 0 && (
                        <span className="text-[10px] text-stone-400 font-normal ml-1">
                          ›
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Level 2 & Level 3: Nested Children & Grandchildren */}
              <div className="pl-2 overflow-y-auto no-scrollbar">
                {activeCategory ? (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-100">
                      <LocalizedClientLink
                        href={`/categories/${activeCategory.handle}`}
                        onClick={() => setIsOpen(false)}
                        className="font-serif text-base font-bold text-charcoal-900 hover:text-terracotta-600 transition"
                      >
                        {activeCategory.name}
                      </LocalizedClientLink>
                      <LocalizedClientLink
                        href={`/categories/${activeCategory.handle}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] text-stone-500 hover:text-charcoal-900"
                      >
                        View all in {activeCategory.name}
                      </LocalizedClientLink>
                    </div>

                    {activeCategory.category_children && activeCategory.category_children.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {activeCategory.category_children.map((child) => {
                          const grandChildren = child.category_children || []
                          return (
                            <div key={child.id} className="space-y-1.5">
                              {/* Level 2 Link */}
                              <LocalizedClientLink
                                href={`/categories/${child.handle}`}
                                onClick={() => setIsOpen(false)}
                                className="font-semibold text-xs text-charcoal-900 hover:text-terracotta-600 transition block pb-0.5 border-b border-stone-100"
                              >
                                {child.name}
                              </LocalizedClientLink>

                              {/* Level 3: Deeply Nested Subcategories */}
                              {grandChildren.length > 0 ? (
                                <ul className="space-y-1 pl-1.5">
                                  {grandChildren.map((grand) => (
                                    <li key={grand.id}>
                                      <LocalizedClientLink
                                        href={`/categories/${grand.handle}`}
                                        onClick={() => setIsOpen(false)}
                                        className="text-[11px] text-stone-500 hover:text-charcoal-900 hover:underline transition block truncate"
                                      >
                                        {grand.name}
                                      </LocalizedClientLink>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <LocalizedClientLink
                                  href={`/categories/${child.handle}`}
                                  onClick={() => setIsOpen(false)}
                                  className="text-[11px] text-terracotta-600 hover:underline block"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-stone-400">
                        <p>No subcategories in this department.</p>
                        <LocalizedClientLink
                          href={`/categories/${activeCategory.handle}`}
                          onClick={() => setIsOpen(false)}
                          className="mt-2 inline-block px-3 py-1.5 rounded-full bg-sand-100 text-charcoal-900 text-xs font-semibold hover:bg-sand-200 transition"
                        >
                          Browse {activeCategory.name} Catalog &rarr;
                        </LocalizedClientLink>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400">
                    Select a category to view subcategories
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
