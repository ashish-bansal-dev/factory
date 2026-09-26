"use client"

import React, { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import VendorMOVProgressBar from "@modules/common/components/wholesale/mov-progress-bar"
import repeat from "@lib/util/repeat"
import { convertToLocale } from "@lib/util/money"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

interface VendorGroup {
  vendorId: string
  vendorName: string
  items: HttpTypes.StoreCartLineItem[]
  subtotal: number
  minimumOrderValue: number
}

export default function ItemsTemplate({ cart }: ItemsTemplateProps) {
  const items = cart?.items

  // Group line items by vendor/brand
  const vendorGroups = useMemo<VendorGroup[]>(() => {
    if (!items || items.length === 0) return []

    const groupsMap = new Map<string, VendorGroup>()

    for (const item of items) {
      const seller = (item.variant?.product as any)?.seller || (item as any)?.seller
      const vendorId = seller?.id || (item.metadata as any)?.seller_id || "direct-factory"
      const vendorName = seller?.name || (item.metadata as any)?.seller_name || "FactoryTribe Direct Brand"
      const mov = Number(seller?.metadata?.minimum_order_value) || Number(seller?.metadata?.mov) || 0

      const itemTotal = Number(item.total ?? (item.unit_price * item.quantity))

      if (!groupsMap.has(vendorId)) {
        groupsMap.set(vendorId, {
          vendorId,
          vendorName,
          items: [item],
          subtotal: itemTotal,
          minimumOrderValue: mov,
        })
      } else {
        const group = groupsMap.get(vendorId)!
        group.items.push(item)
        group.subtotal += itemTotal
      }
    }

    return Array.from(groupsMap.values())
  }, [items])

  if (!items) {
    return (
      <div className="flex flex-col gap-y-4">
        {repeat(3).map((i) => (
          <SkeletonLineItem key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="font-sans">
      <div className="pb-6 flex items-baseline justify-between border-b border-stone-200 mb-6">
        <h1 className="font-serif text-3xl font-bold text-charcoal-900">
          Wholesale Order ({items.length} {items.length === 1 ? "line" : "lines"})
        </h1>
        <span className="text-xs text-stone-500 font-medium">
          Multi-Vendor Cart
        </span>
      </div>

      {vendorGroups.map((group) => {
        return (
          <div
            key={group.vendorId}
            className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm mb-6 flex flex-col gap-y-5"
          >
            {/* Vendor Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-sand-100 border border-stone-200 flex items-center justify-center font-bold text-xs text-charcoal-900 font-serif">
                  {group.vendorName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-charcoal-900">
                    {group.vendorName}
                  </h2>
                  <span className="text-[11px] text-stone-500">
                    Ships in 2-4 business days • Verified Maker
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">Vendor Subtotal</span>
                <span className="font-semibold text-charcoal-900 text-sm">
                  {convertToLocale({
                    amount: group.subtotal,
                    currency_code: cart?.currency_code || "USD",
                  })}
                </span>
              </div>
            </div>

            {/* Vendor Minimum Order Value Progress Bar (rendered only if configured in backend) */}
            {group.minimumOrderValue > 0 && (
              <VendorMOVProgressBar
                vendorName={group.vendorName}
                currentTotal={group.subtotal}
                minimumOrderValue={group.minimumOrderValue}
                currencyCode={cart?.currency_code || "INR"}
              />
            )}

            {/* Items Table for this vendor */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs divide-y divide-stone-100">
                <thead className="text-stone-500 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th scope="col" className="py-2 px-2 text-stone-400">
                      Product
                    </th>
                    <th scope="col" className="py-2 px-2 text-center">
                      Pack Quantity
                    </th>
                    <th scope="col" className="py-2 px-2 hidden sm:table-cell text-right">
                      Price / Unit
                    </th>
                    <th scope="col" className="py-2 px-2 text-right">
                      Line Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {group.items.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code || "USD"}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
