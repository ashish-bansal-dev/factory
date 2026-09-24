"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

export interface CuratedQuoteItem {
  id: string
  productId: string
  productTitle: string
  productHandle?: string
  thumbnail?: string | null
  variantId?: string | null
  variantTitle?: string | null
  sku?: string | null
  quantity: number
  sellerId?: string | null
  sellerName?: string | null
}

interface CuratedQuoteContextType {
  items: CuratedQuoteItem[]
  addItem: (item: Omit<CuratedQuoteItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearQuoteCart: () => void
  totalUnits: number
  totalItems: number
}

const CuratedQuoteContext = createContext<CuratedQuoteContextType | null>(null)

const STORAGE_KEY = "wholesale_curated_quote_items"

export const CuratedQuoteProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CuratedQuoteItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch (e) {
      console.error("Failed to load curated quote cart from storage", e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error("Failed to persist curated quote cart", e)
    }
  }, [items, isLoaded])

  const addItem = (item: Omit<CuratedQuoteItem, "id">) => {
    const id = `${item.productId}-${item.variantId || "default"}`
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === id)
      if (existingIndex > -1) {
        const copy = [...prev]
        copy[existingIndex] = {
          ...copy[existingIndex],
          quantity: copy[existingIndex].quantity + item.quantity,
        }
        return copy
      }
      return [...prev, { ...item, id }]
    })
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const clearQuoteCart = () => {
    setItems([])
  }

  const totalUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const totalItems = items.length

  return (
    <CuratedQuoteContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearQuoteCart,
        totalUnits,
        totalItems,
      }}
    >
      {children}
    </CuratedQuoteContext.Provider>
  )
}

export const useCuratedQuote = () => {
  const context = useContext(CuratedQuoteContext)
  if (!context) {
    throw new Error("useCuratedQuote must be used within a CuratedQuoteProvider")
  }
  return context
}
