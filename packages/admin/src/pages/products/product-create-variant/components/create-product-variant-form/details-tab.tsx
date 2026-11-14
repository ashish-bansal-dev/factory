import { Heading, Input, Select } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { ProductDTO, AttributeType } from "@mercurjs/types"

import { Form } from "../../../../../components/common/form"
import { AttributeValueInput } from "../../../../../components/inputs/attribute-value-input"
import { useTabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { defineTabMeta } from "../../../../../components/tabbed-form/types"
import { CreateProductVariantSchema } from "./constants"

type DetailsTabProps = {
  product: HttpTypes.AdminProduct
}

function DetailsTab({ product }: DetailsTabProps) {
  const { t } = useTranslation()
  const form = useTabbedForm<z.infer<typeof CreateProductVariantSchema>>()
  const variantType = form.watch("variant_type")

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">
    ).attributes?.filter((a) => a.is_variant_axis) ?? []

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto" data-testid="product-variant-create-form-details-tab">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
        <Heading level="h1" data-testid="product-variant-create-form-details-heading">{t("products.variant.create.header")}</Heading>

        <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-title-item">
                  <Form.Label data-testid="product-variant-create-form-title-label">{t("fields.title")}</Form.Label>
                  <Form.Control data-testid="product-variant-create-form-title-control">
                    <Input {...field} data-testid="product-variant-create-form-title-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-title-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="sku"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-sku-item">
                  <Form.Label optional data-testid="product-variant-create-form-sku-label">{t("fields.sku")}</Form.Label>
                  <Form.Control data-testid="product-variant-create-form-sku-control">
                    <Input {...field} data-testid="product-variant-create-form-sku-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-sku-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="variant_type"
            render={({ field: { onChange, ref, ...field } }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-variant-type-item">
                  <Form.Label data-testid="product-variant-create-form-variant-type-label">
                    {t("products.variants.fields.channel.label", "Sales Channel / Type")}
                  </Form.Label>
                  <Form.Control data-testid="product-variant-create-form-variant-type-control">
                    <Select
                      {...field}
                      onValueChange={(val: "retail" | "wholesale") => {
                        onChange(val)
                        if (val === "wholesale") {
                          const currentBundle = form.getValues("bundle_size")
                          if (!currentBundle || Number(currentBundle) === 1) {
                            form.setValue("bundle_size", 6)
                          }
                          const currentDesc = form.getValues("pack_description")
                          if (currentDesc === "Single pc") {
                            form.setValue("pack_description", "")
                          }
                        } else if (val === "retail") {
                          const currentBundle = form.getValues("bundle_size")
                          if (Number(currentBundle) === 6) {
                            form.setValue("bundle_size", 1)
                          }
                          const currentDesc = form.getValues("pack_description")
                          if (!currentDesc) {
                            form.setValue("pack_description", "Single pc")
                          }
                        }
                      }}
                      data-testid="product-variant-create-form-variant-type-select"
                    >
                      <Select.Trigger ref={ref} data-testid="product-variant-create-form-variant-type-trigger">
                        <Select.Value data-testid="product-variant-create-form-variant-type-value" />
                      </Select.Trigger>
                      <Select.Content data-testid="product-variant-create-form-variant-type-content">
                        <Select.Item value="retail" data-testid="product-variant-create-form-variant-type-retail">
                          {t("products.variants.fields.channel.retail", "Retail (Single)")}
                        </Select.Item>
                        <Select.Item value="wholesale" data-testid="product-variant-create-form-variant-type-wholesale">
                          {t("products.variants.fields.channel.wholesale", "Wholesale (Pack)")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-variant-type-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="pack_description"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-pack-description-item">
                  <Form.Label data-testid="product-variant-create-form-pack-description-label">
                    {t("products.variants.fields.packDescription", "Pack Description")}
                  </Form.Label>
                  <Form.Control data-testid="product-variant-create-form-pack-description-control">
                    <Input
                      {...field}
                      placeholder={
                        variantType === "wholesale"
                          ? "Sizes 28-32, Pack of 6 (1-2-2-1)"
                          : "Single pc"
                      }
                      data-testid="product-variant-create-form-pack-description-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-pack-description-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="bundle_size"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-bundle-size-item">
                  <Form.Label data-testid="product-variant-create-form-bundle-size-label">
                    {t("products.variants.fields.bundleSize", "Bundle / Pack Size")}
                  </Form.Label>
                  <Form.Control data-testid="product-variant-create-form-bundle-size-control">
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      data-testid="product-variant-create-form-bundle-size-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-bundle-size-error" />
                </Form.Item>
              )
            }}
          />

          <Form.Field
            control={form.control}
            name="mrp"
            render={({ field }) => {
              return (
                <Form.Item data-testid="product-variant-create-form-mrp-item">
                  <Form.Label optional data-testid="product-variant-create-form-mrp-label">
                    {t("products.variants.fields.mrp", "MRP")}
                  </Form.Label>
                  <Form.Control data-testid="product-variant-create-form-mrp-control">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      {...field}
                      data-testid="product-variant-create-form-mrp-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="product-variant-create-form-mrp-error" />
                </Form.Item>
              )
            }}
          />

          {variantAttributes.map((attribute) => {
            const fieldKey = attribute.handle ?? attribute.id
            return (
              <Form.Field
                key={attribute.id}
                control={form.control}
                name={`options.${fieldKey}`}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Form.Item data-testid={`product-variant-create-form-attribute-${attribute.id}-item`}>
                      <Form.Label data-testid={`product-variant-create-form-attribute-${attribute.id}-label`}>{attribute.name}</Form.Label>
                      <Form.Control data-testid={`product-variant-create-form-attribute-${attribute.id}-control`}>
                        <AttributeValueInput
                          type={AttributeType.SINGLE_SELECT}
                          value={typeof value === "string" ? value : ""}
                          onChange={onChange}
                          availableValues={(attribute.values ?? []).map((v) => ({
                            id: v.id,
                            name: v.name,
                          }))}
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid={`product-variant-create-form-attribute-${attribute.id}-error`} />
                    </Form.Item>
                  )
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

DetailsTab._tabMeta = defineTabMeta<z.infer<typeof CreateProductVariantSchema>>({
  id: "detail",
  labelKey: "priceLists.create.tabs.details",
  validationFields: ["title", "sku", "options", "variant_type", "bundle_size", "pack_description", "mrp"],
})

export default DetailsTab
