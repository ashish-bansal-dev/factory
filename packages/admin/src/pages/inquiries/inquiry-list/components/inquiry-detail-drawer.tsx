import { ArrowUpRightOnBox, Phone, XMarkMini } from "@medusajs/icons"
import { Badge, Button, Drawer, Heading, IconButton, Text, clx } from "@medusajs/ui"
import React from "react"
import { Link } from "react-router-dom"
import { type WholesaleInquiryDTO } from "../../../../hooks/api/inquiries"

export interface GroupedInquiry {
  id: string
  batchId?: string | null
  createdAt: string
  storeName: string
  contactNumber: string
  location: string
  sourceDomain: string
  status: string
  totalUnits: number
  itemCount: number
  items: WholesaleInquiryDTO[]
}

interface InquiryDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiry: GroupedInquiry | null
}

export const InquiryDetailDrawer: React.FC<InquiryDetailDrawerProps> = ({
  open,
  onOpenChange,
  inquiry,
}) => {
  if (!inquiry) return null

  const cleanPhone = inquiry.contactNumber.replace(/\D/g, "")
  const isShowroom =
    Boolean(inquiry.sourceDomain) &&
    !inquiry.sourceDomain.includes("factorytribe.com") &&
    inquiry.sourceDomain !== "factorytribe.com"

  const itemsListSummary = inquiry.items
    .map(
      (it, idx) =>
        `${idx + 1}. ${(it.metadata?.product_title as string) || it.product_id} (Qty: ${it.metadata?.quantity || 1})`
    )
    .join("\n")

  const whatsappMessage = encodeURIComponent(
    `Hi ${inquiry.storeName}, following up on your wholesale inquiry for ${inquiry.itemCount} ${inquiry.itemCount === 1 ? "product" : "products"}:\n\n${itemsListSummary}\n\nWe are preparing your quotation.`
  )
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-[560px] bg-ui-bg-base flex flex-col font-sans">
        <Drawer.Header className="flex items-center justify-between border-b border-ui-border-base px-6 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Heading level="h2" className="text-base font-bold text-ui-fg-base">
                Inquiry #{inquiry.id.slice(-6)}
              </Heading>
              <Badge size="small" color={inquiry.status === "new" ? "blue" : inquiry.status === "contacted" ? "green" : "grey"}>
                {inquiry.status.toUpperCase()}
              </Badge>
            </div>
            <Text size="xsmall" className="text-ui-fg-muted">
              Received on {new Date(inquiry.createdAt).toLocaleString()}
            </Text>
          </div>
          <Drawer.Close asChild>
            <IconButton size="small" variant="transparent" className="text-ui-fg-muted hover:text-ui-fg-subtle">
              <XMarkMini />
            </IconButton>
          </Drawer.Close>
        </Drawer.Header>

        <Drawer.Body className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Buyer Information Card */}
          <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
                Buyer Business Profile
              </span>
              <Badge size="small" color={isShowroom ? "purple" : "grey"}>
                {isShowroom ? `Showroom: ${inquiry.sourceDomain}` : "Marketplace Hub"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Store / Company
                </Text>
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  {inquiry.storeName}
                </Text>
              </div>

              <div>
                <Text size="xsmall" className="text-ui-fg-muted">
                  Location
                </Text>
                <Text size="small" className="text-ui-fg-base">
                  {inquiry.location}
                </Text>
              </div>

              <div className="col-span-2 flex items-center justify-between pt-1 border-t border-ui-border-base/60">
                <div>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    Contact / WhatsApp
                  </Text>
                  <Text size="small" className="font-mono font-medium text-ui-fg-base">
                    {inquiry.contactNumber}
                  </Text>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Requested Products Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <Heading level="h3" className="text-sm font-bold text-ui-fg-base">
                  Requested Products ({inquiry.itemCount})
                </Heading>
              </div>
              <Badge size="small" color="blue">
                Total: {inquiry.totalUnits} pcs
              </Badge>
            </div>

            <div className="divide-y divide-ui-border-base rounded-xl border border-ui-border-base overflow-hidden bg-ui-bg-base">
              {inquiry.items.map((item, idx) => {
                const title = (item.metadata?.product_title as string) || item.product_id
                const qty = item.metadata?.quantity || 1
                const variantTitle = (item.metadata?.item_variant_title as string) || (item.variant_id ? `Variant: ${item.variant_id}` : null)
                const sku = (item.metadata?.item_sku as string) || null
                const notes = item.metadata?.notes as string | undefined

                return (
                  <div key={item.id} className="p-4 flex flex-col gap-2 hover:bg-ui-bg-subtle/50 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col flex-1">
                        <Link
                          to={`/products/${item.product_id}`}
                          className="text-ui-fg-interactive hover:underline text-xs font-bold flex items-center gap-1"
                        >
                          <span>{idx + 1}. {title}</span>
                          <ArrowUpRightOnBox className="w-3.5 h-3.5 shrink-0" />
                        </Link>
                        {variantTitle && (
                          <Text size="xsmall" className="text-ui-fg-muted mt-0.5">
                            {variantTitle} {sku ? `• SKU: ${sku}` : ""}
                          </Text>
                        )}
                        <Text size="xsmall" className="font-mono text-[10px] text-ui-fg-muted mt-0.5">
                          ID: {item.product_id}
                        </Text>
                      </div>

                      <Badge size="small" color="blue" className="shrink-0 font-bold">
                        Qty: {qty}
                      </Badge>
                    </div>

                    {notes && (
                      <div className="p-2.5 rounded-lg bg-ui-bg-subtle text-xs text-ui-fg-subtle border border-ui-border-base/60 mt-1 whitespace-pre-line">
                        {notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Drawer.Body>

        <Drawer.Footer className="border-t border-ui-border-base px-6 py-4 flex items-center justify-between bg-ui-bg-subtle">
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">
              Close
            </Button>
          </Drawer.Close>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Follow up on WhatsApp</span>
          </a>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
