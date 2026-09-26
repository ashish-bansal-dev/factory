"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

interface MobileMenuProps {
  categories: HttpTypes.StoreProductCategory[]
  isTenant?: boolean
  tenantSeller?: any
}

export default function MobileMenu({
  categories = [],
  isTenant = false,
  tenantSeller,
}: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close drawer on navigation
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const safeCategories = Array.isArray(categories) ? categories : []
  const topCategories = safeCategories.filter((c) => !c.parent_category && !c.parent_category_id)

  const toggleCategoryExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <div className="lg:hidden font-sans">
      {/* Mobile Hamburger Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 -ml-2 rounded-lg flex items-center justify-center text-charcoal-900 hover:bg-sand-100 transition active:scale-95"
        aria-label="Open mobile navigation menu"
      >
        <svg
          className="w-6 h-6 text-charcoal-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Slide-over Drawer Overlay */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-[320px] bg-white shadow-2xl flex flex-col border-r border-stone-200 animate-in slide-in-from-left duration-250 ease-out">
              {/* Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-sand-50/70">
                <LocalizedClientLink
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2"
                >
                  <span className="font-serif text-xl font-bold tracking-tight text-charcoal-900">
                    {isTenant && tenantSeller ? tenantSeller.name : "FactoryTribe"}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sand-200 text-charcoal-800">
                    Wholesale
                  </span>
                </LocalizedClientLink>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-stone-500 hover:text-charcoal-900 hover:bg-stone-200/60 transition"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links with Nested Categories Accordion */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <LocalizedClientLink
                  href="/store"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl font-medium text-sm text-charcoal-900 hover:bg-sand-50 transition"
                >
                  <span>Catalog</span>
                  <span className="text-stone-400">›</span>
                </LocalizedClientLink>

                {!isTenant && (
                  <>
                    <LocalizedClientLink
                      href="/brands"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl font-medium text-sm text-charcoal-900 hover:bg-sand-50 transition"
                    >
                      <span>Brands</span>
                      <span className="text-stone-400">›</span>
                    </LocalizedClientLink>

                    <LocalizedClientLink
                      href="/sellers"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl font-medium text-sm text-charcoal-900 hover:bg-sand-50 transition"
                    >
                      <span>Suppliers</span>
                      <span className="text-stone-400">›</span>
                    </LocalizedClientLink>

                    {/* Expandable Nested Categories Accordion */}
                    <div className="rounded-xl border border-stone-200/80 bg-sand-50/40 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        className="w-full flex items-center justify-between p-3 font-medium text-sm text-charcoal-900 text-left hover:bg-sand-100/50 transition"
                      >
                        <span className="font-semibold">Categories</span>
                        <svg
                          className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                            categoriesOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {categoriesOpen && (
                        <div className="px-3 pb-3 space-y-1 text-xs border-t border-stone-200/60 pt-2 bg-white">
                          <LocalizedClientLink
                            href="/categories"
                            onClick={() => setIsOpen(false)}
                            className="block py-1.5 px-2 text-terracotta-600 font-semibold hover:underline"
                          >
                            Browse All Categories &rarr;
                          </LocalizedClientLink>

                          {topCategories.map((cat) => {
                            const isExpanded = expandedCategories[cat.id]
                            const children = cat.category_children || []

                            return (
                              <div key={cat.id} className="space-y-1">
                                <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-stone-50">
                                  <LocalizedClientLink
                                    href={`/categories/${cat.handle}`}
                                    onClick={() => setIsOpen(false)}
                                    className="font-medium text-charcoal-900 hover:text-terracotta-600 truncate flex-1"
                                  >
                                    {cat.name}
                                  </LocalizedClientLink>

                                  {children.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleCategoryExpand(cat.id, e)}
                                      className="w-6 h-6 flex items-center justify-center text-stone-500 hover:text-charcoal-900 font-bold"
                                      aria-label="Expand category"
                                    >
                                      {isExpanded ? "−" : "+"}
                                    </button>
                                  )}
                                </div>

                                {/* Level 2 Children */}
                                {isExpanded && children.length > 0 && (
                                  <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-stone-200 ml-2">
                                    {children.map((child) => {
                                      const grandChildren = child.category_children || []
                                      const isChildExpanded = expandedCategories[child.id]

                                      return (
                                        <div key={child.id} className="space-y-0.5">
                                          <div className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-stone-50">
                                            <LocalizedClientLink
                                              href={`/categories/${child.handle}`}
                                              onClick={() => setIsOpen(false)}
                                              className="text-[11px] text-stone-700 hover:text-charcoal-900 truncate flex-1"
                                            >
                                              {child.name}
                                            </LocalizedClientLink>

                                            {grandChildren.length > 0 && (
                                              <button
                                                type="button"
                                                onClick={(e) =>
                                                  toggleCategoryExpand(child.id, e)
                                                }
                                                className="w-5 h-5 flex items-center justify-center text-stone-400 font-bold text-[10px]"
                                              >
                                                {isChildExpanded ? "−" : "+"}
                                              </button>
                                            )}
                                          </div>

                                          {/* Level 3 Grandchildren */}
                                          {isChildExpanded && grandChildren.length > 0 && (
                                            <div className="pl-3 py-1 space-y-1 border-l border-stone-200 ml-1">
                                              {grandChildren.map((grand) => (
                                                <LocalizedClientLink
                                                  key={grand.id}
                                                  href={`/categories/${grand.handle}`}
                                                  onClick={() => setIsOpen(false)}
                                                  className="block py-0.5 text-[10px] text-stone-500 hover:text-charcoal-900 truncate"
                                                >
                                                  {grand.name}
                                                </LocalizedClientLink>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <LocalizedClientLink
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl font-medium text-sm text-charcoal-900 hover:bg-sand-50 transition"
                >
                  <span>Account</span>
                  <span className="text-stone-400">›</span>
                </LocalizedClientLink>
              </div>

              {/* Bottom Support Section */}
              <div className="p-4 border-t border-stone-200 bg-sand-50/70 space-y-3">
                <div className="text-xs text-stone-600">
                  <span className="block font-semibold text-charcoal-900 mb-0.5">
                    Wholesale Support
                  </span>
                  <span>Direct phone & WhatsApp: +91-9782077711</span>
                </div>

                <a
                  href={`https://wa.me/919782077711?text=${encodeURIComponent(
                    "Hello FactoryTribe! I need assistance with wholesale catalog orders."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 rounded-xl bg-forest-900 text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-forest-800 transition shadow-xs"
                >
                  <span>Chat on WhatsApp</span>
                </a>

                <div className="text-[10px] text-stone-500 flex items-center justify-between pt-1">
                  <span>GST Invoicing</span>
                  <span>•</span>
                  <span>Net 60 Terms</span>
                  <span>•</span>
                  <span>Factory Direct</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
