import { ArrowUpRightOnBox } from "@medusajs/icons"
import {
  Badge,
  Button,
  CurrencyInput,
  FocusModal,
  Heading,
  Hint,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { FormEvent, useEffect, useState } from "react"
import { Link } from "react-router-dom"

import {
  useConvertInquiryToDraftOrder,
  type VendorInquiryDTO,
} from "../../../../hooks/api/inquiries"
import { useProduct } from "../../../../hooks/api/products"
import { useCurrentSeller } from "../../../../hooks/api/sellers"

type CreateDraftOrderModalProps = {
  inquiry: VendorInquiryDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateDraftOrderModal = ({
  inquiry,
  open,
  onOpenChange,
}: CreateDraftOrderModalProps) => {
  const { currency_code } = useCurrentSeller()
  const sellerCurrency = currency_code || "usd"

  const { product, isLoading: isLoadingProduct } = useProduct(
    inquiry.product_id,
    { fields: "*variants" },
    { enabled: open && !!inquiry.product_id }
  )

  const defaultQuantity = inquiry.metadata?.quantity
    ? Number(inquiry.metadata.quantity)
    : 1

  const [quantity, setQuantity] = useState<number>(defaultQuantity)
  const [unitPrice, setUnitPrice] = useState<number | undefined>(undefined)
  const [shippingAmount, setShippingAmount] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState<string>("")
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    inquiry.variant_id || ""
  )
  const [errors, setErrors] = useState<{
    unitPrice?: string
    quantity?: string
    variantId?: string
  }>({})

  useEffect(() => {
    if (inquiry) {
      setQuantity(
        inquiry.metadata?.quantity ? Number(inquiry.metadata.quantity) : 1
      )
      setUnitPrice(undefined)
      setShippingAmount(undefined)
      setNotes(
        typeof inquiry.metadata?.notes === "string" ? inquiry.metadata.notes : ""
      )
      setSelectedVariantId(inquiry.variant_id || "")
      setErrors({})
    }
  }, [inquiry])

  useEffect(() => {
    if (!selectedVariantId && product?.variants?.length) {
      setSelectedVariantId(product.variants[0].id)
    }
  }, [product, selectedVariantId])

  const { mutateAsync: convertToDraftOrder, isPending } =
    useConvertInquiryToDraftOrder(inquiry.id)

  const productTitle =
    (inquiry.metadata?.product_title as string) ||
    product?.title ||
    inquiry.product_id

  const cleanPhone = inquiry.contact_number.replace(/\D/g, "")
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hi ${inquiry.store_name}, sending your draft order for inquiry #${inquiry.id.slice(-6)}`
  )}`

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!unitPrice || unitPrice <= 0) {
      newErrors.unitPrice = "Please enter a valid negotiated unit or pack price"
    }
    if (!quantity || quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1"
    }

    const effectiveVariantId = selectedVariantId || inquiry.variant_id
    if (!effectiveVariantId) {
      newErrors.variantId = "Please select a product variant for the draft order"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const selectedVariant = product?.variants?.find(
      (v) => v.id === effectiveVariantId
    )
    const lineItemTitle = selectedVariant?.title
      ? `${productTitle} - ${selectedVariant.title}`
      : productTitle

    try {
      await convertToDraftOrder({
        items: [
          {
            variant_id: effectiveVariantId as string,
            quantity: Math.floor(quantity),
            unit_price: Number(unitPrice),
            title: lineItemTitle,
          },
        ],
        shipping_amount:
          shippingAmount !== undefined && shippingAmount >= 0
            ? Number(shippingAmount)
            : undefined,
        notes: notes.trim() || undefined,
        currency_code: sellerCurrency,
      })

      toast.success("Draft order created successfully")
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create draft order"
      toast.error(message)
    }
  }

  const subtotal = (unitPrice ?? 0) * (quantity ?? 0)
  const total = subtotal + (shippingAmount ?? 0)

  return (
    <FocusModal open={open} onOpenChange={onOpenChange}>
      <FocusModal.Content className="fixed inset-4 m-auto max-h-[90vh] max-w-2xl overflow-hidden rounded-xl border border-ui-border-base bg-ui-bg-base shadow-elevation-modal">
        <FocusModal.Header>
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <FocusModal.Title asChild>
                <Heading level="h2" className="text-sm font-semibold">
                  Create Draft Order from Wholesale Inquiry
                </Heading>
              </FocusModal.Title>
              <FocusModal.Description className="text-ui-fg-subtle text-xs">
                Issue a custom draft order with agreed negotiated terms for {inquiry.store_name}.
              </FocusModal.Description>
            </div>
            <Badge size="small" color="blue">
              Inquiry #{inquiry.id.slice(-6)}
            </Badge>
          </div>
        </FocusModal.Header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <FocusModal.Body className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus" className="text-ui-fg-base">
                  Retailer &amp; Requested Item
                </Text>
                <Badge size="2xsmall" color="grey">
                  {inquiry.channel?.toUpperCase() || "WHOLESALE"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Retailer Store
                  </Text>
                  <Text size="small" weight="plus">
                    {inquiry.store_name}
                  </Text>
                </div>
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    WhatsApp / Phone
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text size="small" className="font-mono">
                      {inquiry.contact_number}
                    </Text>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 inline-flex items-center"
                      title="Open WhatsApp chat"
                    >
                      <ArrowUpRightOnBox className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Location
                  </Text>
                  <Text size="small">{inquiry.location || "-"}</Text>
                </div>
                <div>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    Product
                  </Text>
                  <Link
                    to={`/products/${inquiry.product_id}`}
                    target="_blank"
                    className="text-ui-fg-interactive hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span className="truncate max-w-[200px]">{productTitle}</span>
                    <ArrowUpRightOnBox className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {product?.variants && product.variants.length > 1 && (
                <div className="space-y-1">
                  <Label size="small" weight="plus">
                    Select Pack / Variant
                  </Label>
                  <Select
                    value={selectedVariantId}
                    onValueChange={(val) => {
                      setSelectedVariantId(val)
                      setErrors((prev) => ({ ...prev, variantId: undefined }))
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Select variant" />
                    </Select.Trigger>
                    <Select.Content>
                      {product.variants.map((v) => (
                        <Select.Item key={v.id} value={v.id}>
                          {v.title} {v.sku ? `(${v.sku})` : ""}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                  {errors.variantId && (
                    <Hint variant="error">{errors.variantId}</Hint>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label size="small" weight="plus">
                    Negotiated Pack / Unit Price ({sellerCurrency.toUpperCase()}){" "}
                    <span className="text-ui-fg-error">*</span>
                  </Label>
                  <CurrencyInput
                    code={sellerCurrency}
                    symbol={sellerCurrency === "usd" ? "$" : undefined}
                    placeholder="0.00"
                    value={unitPrice !== undefined ? unitPrice : ""}
                    onValueChange={(val) => {
                      setUnitPrice(val !== undefined ? Number(val) : undefined)
                      setErrors((prev) => ({ ...prev, unitPrice: undefined }))
                    }}
                  />
                  {errors.unitPrice ? (
                    <Hint variant="error">{errors.unitPrice}</Hint>
                  ) : (
                    <Hint>Price agreed with the wholesale buyer</Hint>
                  )}
                </div>

                <div className="space-y-1">
                  <Label size="small" weight="plus">
                    Negotiated Quantity <span className="text-ui-fg-error">*</span>
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setQuantity(val)
                      setErrors((prev) => ({ ...prev, quantity: undefined }))
                    }}
                  />
                  {errors.quantity ? (
                    <Hint variant="error">{errors.quantity}</Hint>
                  ) : (
                    <Hint>
                      {inquiry.metadata?.quantity
                        ? `Requested in inquiry: ${inquiry.metadata.quantity}`
                        : "Number of packs/units"}
                    </Hint>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label size="small">
                    Shipping Fee ({sellerCurrency.toUpperCase()})
                  </Label>
                  <CurrencyInput
                    code={sellerCurrency}
                    symbol={sellerCurrency === "usd" ? "$" : undefined}
                    placeholder="0.00 (Optional)"
                    value={shippingAmount !== undefined ? shippingAmount : ""}
                    onValueChange={(val) =>
                      setShippingAmount(val !== undefined ? Number(val) : undefined)
                    }
                  />
                  <Hint>Optional negotiated freight charge</Hint>
                </div>

                <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle/30 p-3 flex flex-col justify-center space-y-1">
                  <div className="flex justify-between text-xs text-ui-fg-subtle">
                    <span>Subtotal:</span>
                    <span className="font-mono">
                      {sellerCurrency.toUpperCase()} {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {shippingAmount !== undefined && shippingAmount > 0 && (
                    <div className="flex justify-between text-xs text-ui-fg-subtle">
                      <span>Shipping:</span>
                      <span className="font-mono">
                        {sellerCurrency.toUpperCase()} {shippingAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold border-t border-ui-border-base pt-1">
                    <span>Total:</span>
                    <span className="font-mono text-ui-fg-interactive">
                      {sellerCurrency.toUpperCase()} {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label size="small">Notes / Terms</Label>
                <Textarea
                  placeholder="Payment within 15 days, dispatch via FedEx Freight, special packaging requested..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <Hint>Attached directly to the draft order metadata</Hint>
              </div>
            </div>
          </FocusModal.Body>

          <FocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2 w-full">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                type="submit"
                isLoading={isPending}
                disabled={isLoadingProduct}
              >
                Generate Draft Order
              </Button>
            </div>
          </FocusModal.Footer>
        </form>
      </FocusModal.Content>
    </FocusModal>
  )
}
