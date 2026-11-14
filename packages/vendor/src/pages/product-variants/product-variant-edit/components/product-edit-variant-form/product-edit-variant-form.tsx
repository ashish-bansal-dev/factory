import { zodResolver } from "@hookform/resolvers/zod"
import { InformationCircleSolid } from "@medusajs/icons"
import { Button, Divider, Heading, Input, Select, Tooltip, toast } from "@medusajs/ui"
import i18next from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { ProductDTO, AttributeType, MercurFeatureFlags } from "@mercurjs/types"

import { Form } from "@components/common/form"
import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { CountrySelect } from "@components/inputs/country-select"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useFeatureFlags } from "@hooks/api"
import { useUpdateProductVariant } from "@hooks/api/products"
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "@lib/form-helpers"
import { optionalInt } from "@lib/validation"

type ProductEditVariantFormProps = {
  product: HttpTypes.AdminProduct
  variant: HttpTypes.AdminProductVariant
}

const ProductEditVariantSchema = z.object({
  title: z.string().min(1, i18next.t("products.variant.validation.titleRequired")),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().optional(),
  weight: optionalInt,
  height: optionalInt,
  width: optionalInt,
  length: optionalInt,
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  options: z
    .record(
      z.string(),
      z.string().min(1, i18next.t("products.variant.validation.optionRequired"))
    )
    .optional(),
  variant_type: z.enum(["retail", "wholesale"]).default("retail"),
  bundle_size: z.union([z.coerce.number().int().min(1), z.literal("")]).default(1),
  pack_description: z.string().optional(),
  mrp: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
})

export const ProductEditVariantForm = ({
  variant,
  product,
}: ProductEditVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { feature_flags } = useFeatureFlags()
  const isProductRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  const variantAttributes =
    (product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">)
      .attributes?.filter((a) => a.is_variant_axis) ?? []

  // Form fields are keyed by attribute handle/id; the submit payload
  // translates them to option titles (= attribute names) — the shape
  // the stock Medusa variant route expects under `options`. Prefill
  // from the existing variant.options[] (Medusa-side option-value
  // pairing, matched to the attribute by option title = attribute name).
  const defaultOptions = variantAttributes.reduce<Record<string, string>>(
    (acc, attribute) => {
      const key = attribute.handle ?? attribute.id
      const matched = variant.options?.find(
        (o) => o.option?.title === attribute.name,
      )
      acc[key] = matched?.value ?? ""
      return acc
    },
    {},
  )

  const initialVariantType =
    (variant.metadata?.variant_type as "retail" | "wholesale" | undefined) ??
    (Number(variant.metadata?.bundle_size) > 1 ? "wholesale" : "retail")
  const initialBundleSize = variant.metadata?.bundle_size
    ? Number(variant.metadata.bundle_size)
    : 1
  const initialPackDescription =
    (variant.metadata?.pack_description as string | undefined) ??
    (variant.metadata?.variant_type === "wholesale" ? "" : "Single pc")
  const initialMrp = variant.metadata?.mrp
    ? Number(variant.metadata.mrp)
    : (variant as any).mrp ?? ""

  const form = useForm<z.infer<typeof ProductEditVariantSchema>>({
    defaultValues: {
      title: variant.title || "",
      sku: variant.sku || "",
      ean: variant.ean || "",
      upc: variant.upc || "",
      barcode: variant.barcode || "",
      weight: variant.weight || "",
      height: variant.height || "",
      width: variant.width || "",
      length: variant.length || "",
      mid_code: variant.mid_code || "",
      hs_code: variant.hs_code || "",
      origin_country: variant.origin_country || "",
      options: defaultOptions,
      variant_type: initialVariantType,
      bundle_size: initialBundleSize,
      pack_description: initialPackDescription,
      mrp: initialMrp,
    },
    resolver: zodResolver(ProductEditVariantSchema) as any,
  })

  const variantType = form.watch("variant_type")

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id,
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    const {
      title,
      weight,
      height,
      width,
      length,
      options,
      variant_type,
      bundle_size,
      pack_description,
      mrp,
      ...optional
    } = data

    const nullableData = transformNullableFormData(optional)

    // Backend keys options by option title (= attribute name). Form
    // keys by handle/id; remap and drop empties.
    const cleanedOptions = variantAttributes.reduce<Record<string, string>>(
      (acc, attr) => {
        const fieldKey = attr.handle ?? attr.id
        const v = options?.[fieldKey]
        if (v && attr.name) acc[attr.name] = v
        return acc
      },
      {},
    )

    await mutateAsync(
      {
        weight: transformNullableFormNumber(weight),
        height: transformNullableFormNumber(height),
        width: transformNullableFormNumber(width),
        length: transformNullableFormNumber(length),
        title,
        options: Object.keys(cleanedOptions).length
          ? cleanedOptions
          : undefined,
        ...nullableData,
        metadata: {
          ...variant.metadata,
          variant_type,
          bundle_size: Number(bundle_size) || 1,
          pack_description,
          mrp: mrp ? Number(mrp) : undefined,
        },
      },
      {
        onSuccess: () => {
          handleSuccess("../")
          toast.success(
            isProductRequestEnabled
              ? t("products.edit.requestSuccessToast")
              : t("products.variant.edit.success"),
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex size-full flex-col gap-y-8 overflow-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.title")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="variant_type"
              render={({ field: { onChange, ref, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t(
                        "products.variants.fields.channel.label",
                        "Sales Channel / Type"
                      )}
                    </Form.Label>
                    <Form.Control>
                      <Select
                        {...field}
                        onValueChange={(val: "retail" | "wholesale") => {
                          onChange(val)
                          if (val === "wholesale") {
                            const currentBundle = form.getValues("bundle_size")
                            if (!currentBundle || Number(currentBundle) === 1) {
                              form.setValue("bundle_size", 6)
                            }
                            const currentDesc =
                              form.getValues("pack_description")
                            if (currentDesc === "Single pc") {
                              form.setValue("pack_description", "")
                            }
                          } else if (val === "retail") {
                            const currentBundle = form.getValues("bundle_size")
                            if (Number(currentBundle) === 6) {
                              form.setValue("bundle_size", 1)
                            }
                            const currentDesc =
                              form.getValues("pack_description")
                            if (!currentDesc) {
                              form.setValue("pack_description", "Single pc")
                            }
                          }
                        }}
                      >
                        <Select.Trigger
                          ref={ref}
                          data-testid="edit-variant-variant-type-trigger"
                        >
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="retail">
                            {t(
                              "products.variants.fields.channel.retail",
                              "Retail (Single)"
                            )}
                          </Select.Item>
                          <Select.Item value="wholesale">
                            {t(
                              "products.variants.fields.channel.wholesale",
                              "Wholesale (Pack)"
                            )}
                          </Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="pack_description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t(
                        "products.variants.fields.packDescription",
                        "Pack Description"
                      )}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder={
                          variantType === "wholesale"
                            ? "Sizes 28-32, Pack of 6 (1-2-2-1)"
                            : "Single pc"
                        }
                        data-testid="edit-variant-pack-description-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="bundle_size"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t(
                        "products.variants.fields.bundleSize",
                        "Bundle / Pack Size"
                      )}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        data-testid="edit-variant-bundle-size-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="mrp"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("products.variants.fields.mrp", "MRP")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        {...field}
                        data-testid="edit-variant-mrp-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
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
                      <Form.Item>
                        <Form.Label>{attribute.name}</Form.Label>
                        <Form.Control>
                          <AttributeValueInput
                            type={AttributeType.SINGLE_SELECT}
                            value={typeof value === "string" ? value : ""}
                            onChange={onChange}
                            availableValues={(attribute.values ?? []).map(
                              (v) => ({
                                id: v.id,
                                name: v.name,
                              }),
                            )}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              )
            })}
          </div>
          <Divider />
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.sku")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="ean"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.ean")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="upc"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.upc")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="barcode"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.barcode")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
          <Divider />
          <div className="flex flex-col gap-y-4">
            <div className="flex items-center gap-x-1">
              <Heading level="h2">{t("products.attributes")}</Heading>
              <Tooltip content={t("products.variant.edit.attributesTooltip")}>
                <InformationCircleSolid className="text-ui-fg-muted" />
              </Tooltip>
            </div>
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.weight")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.width")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.length")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.height")}</Form.Label>
                    <Form.Control>
                      <Input type="number" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.midCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.hsCode")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("fields.countryOfOrigin")}
                    </Form.Label>
                    <Form.Control>
                      <CountrySelect {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
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
