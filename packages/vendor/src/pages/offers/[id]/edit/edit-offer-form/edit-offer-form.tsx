import { Badge, Button, Input, Select, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useShippingProfiles } from "../../../../../hooks/api/shipping-profiles"
import { useUpdateOffer } from "../../../../../hooks/api/offers"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { OfferDetail } from "../../../common/types"
import { EditOfferSchema } from "./schema"

type Props = { offer: OfferDetail }

export const EditOfferForm = ({ offer }: Props) => {
  const { t } = useTranslation()
  const dir = useDocumentDirection()
  const { handleSuccess } = useRouteModal()

  const { shipping_profiles } = useShippingProfiles({ limit: 1000 })
  const offerType = offer.offer_type || "retail"
  const isWholesale = offerType === "wholesale"

  const form = useExtendableForm({
    schema: EditOfferSchema,
    model: "offer",
    zone: "edit",
    data: offer,
    defaultValues: {
      sku: offer.sku ?? "",
      shipping_profile_id: offer.shipping_profile_id ?? "",
      bundle_size: offer.bundle_size ?? (isWholesale ? 6 : 1),
      mrp: offer.mrp != null ? String(offer.mrp) : "",
      metadata: offer.metadata ?? null,
    },
  })

  const { mutateAsync, isPending } = useUpdateOffer(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const bundleSizeNum =
      values.bundle_size !== "" && values.bundle_size !== undefined
        ? Number(values.bundle_size)
        : undefined
    const mrpNum =
      values.mrp !== "" && values.mrp !== undefined && values.mrp !== null
        ? Number(values.mrp)
        : undefined

    await mutateAsync(
      {
        sku: values.sku,
        shipping_profile_id: values.shipping_profile_id,
        bundle_size: bundleSizeNum,
        mrp: mrpNum,
        metadata: {
          ...(values.metadata ?? {}),
          bundle_size: bundleSizeNum,
          mrp: mrpNum,
        },
      } as Parameters<typeof mutateAsync>[0],

      {
        onSuccess: () => {
          toast.success(t("offers.edit.successToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="offer-edit-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          {/* Offer Channel Badge */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-ui-bg-subtle border border-ui-border-base">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-ui-fg-muted">Offer Channel</span>
              <span className="text-xs font-semibold text-ui-fg-base mt-0.5">
                {isWholesale ? "Wholesale (FactoryTribe)" : "Retail (ThreadBuy)"}
              </span>
            </div>
            <Badge color={isWholesale ? "purple" : "blue"} size="2xsmall">
              {isWholesale ? "Wholesale" : "Retail"}
            </Badge>
          </div>

          <Form.Field
            control={form.control}
            name="sku"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("offers.fields.sku")}</Form.Label>
                <Form.Control>
                  <Input maxLength={64} autoComplete="off" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="shipping_profile_id"
            render={({ field: { ref: _r, onChange, ...f } }) => (
              <Form.Item>
                <Form.Label>{t("offers.fields.shippingProfile")}</Form.Label>
                <Form.Control>
                  <Select {...f} onValueChange={onChange} dir={dir}>
                    <Select.Trigger ref={_r}>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {(shipping_profiles ?? []).map((p) => (
                        <Select.Item key={p.id} value={p.id}>
                          {p.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          {/* Pack Size Field (Bundle Size) */}
          <Form.Field
            control={form.control}
            name="bundle_size"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Pack Size (Bundle Size)</Form.Label>
                <Form.Control>
                  <Input
                    type="number"
                    min={1}
                    autoComplete="off"
                    placeholder="1"
                    {...field}
                    value={field.value ?? ""}
                  />
                </Form.Control>
                <Form.Hint>Number of units packaged together (default 4 for wholesale, 1 for retail).</Form.Hint>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          {/* Maximum Retail Price (MRP) */}
          <Form.Field
            control={form.control}
            name="mrp"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>Maximum Retail Price (MRP)</Form.Label>
                <Form.Control>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    autoComplete="off"
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ""}
                  />
                </Form.Control>
                <Form.Hint>Original retail reference price for display savings and retailer margins.</Form.Hint>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <FormExtensionZone
            model="offer"
            zone="edit"
            control={form.control}
            data={offer}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
