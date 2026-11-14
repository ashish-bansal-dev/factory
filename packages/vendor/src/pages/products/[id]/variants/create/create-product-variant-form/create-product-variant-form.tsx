import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Select, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { HttpTypes } from "@medusajs/types"
import { AttributeType, MercurFeatureFlags, ProductDTO } from "@mercurjs/types"

import { Form } from "@components/common/form"
import { AttributeValueInput } from "@components/inputs/attribute-value-input"
import { RouteFocusModal, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useFeatureFlags } from "@hooks/api"
import { useCreateProductVariant } from "@hooks/api/products"
import { CreateProductVariantSchema } from "./constants"

export type CreateProductVariantSchemaType = z.infer<
  typeof CreateProductVariantSchema
>

type CreateProductVariantFormProps = {
  product: HttpTypes.AdminProduct
}

export const CreateProductVariantForm = ({
  product,
}: CreateProductVariantFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { feature_flags } = useFeatureFlags()
  const isProductRequestEnabled =
    !!feature_flags?.[MercurFeatureFlags.PRODUCT_REQUEST]

  const variantAttributes =
    (
      product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">
    ).attributes?.filter((a) => a.is_variant_axis) ?? []

  // Seed every variant-axis option with an empty value so the required
  // validation fires for untouched selects (an empty record would pass).
  const defaultOptions = variantAttributes.reduce<Record<string, string>>(
    (acc, attribute) => {
      acc[attribute.handle ?? attribute.id] = ""
      return acc
    },
    {}
  )

  const form = useForm<CreateProductVariantSchemaType>({
    defaultValues: {
      title: "",
      sku: "",
      options: defaultOptions,
      variant_type: "retail",
      bundle_size: 1,
      pack_description: "Single pc",
      mrp: "",
    },
    resolver: zodResolver(CreateProductVariantSchema) as any,
  })

  const { mutateAsync, isPending } = useCreateProductVariant(product.id)
  const variantType = form.watch("variant_type")

  const handleSubmit = form.handleSubmit(async (data) => {
    const {
      title,
      sku,
      options,
      variant_type,
      bundle_size,
      pack_description,
      mrp,
    } = data

    // Form keys variant fields by `handle ?? id`; backend keys options
    // by option title (= attribute name). Remap before submitting.
    const cleanedOptions = variantAttributes.reduce<Record<string, string>>(
      (acc, attr) => {
        const fieldKey = attr.handle ?? attr.id
        const v = options?.[fieldKey]
        if (v && attr.name) acc[attr.name] = v
        return acc
      },
      {}
    )

    await mutateAsync(
      {
        title,
        sku: sku || undefined,
        options: Object.keys(cleanedOptions).length
          ? cleanedOptions
          : undefined,
        metadata: {
          variant_type,
          bundle_size: Number(bundle_size) || 1,
          pack_description: pack_description || "Single pc",
          mrp: mrp ? Number(mrp) : undefined,
        },
      },
      {
        onSuccess: () => {
          handleSuccess()
          toast.success(
            isProductRequestEnabled
              ? t("products.edit.requestSuccessToast")
              : t("products.variant.create.successToast")
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteFocusModal.Header>
          <RouteFocusModal.Title asChild>
            <span className="sr-only">
              {t("products.variant.create.header")}
            </span>
          </RouteFocusModal.Title>
          <RouteFocusModal.Description className="sr-only">
            {t("products.variant.create.header")}
          </RouteFocusModal.Description>
        </RouteFocusModal.Header>

        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-y-auto">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-8 py-16">
            <Heading level="h1">{t("products.variant.create.header")}</Heading>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.title")}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          data-testid="create-variant-title-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />

              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.sku")}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          data-testid="create-variant-sku-input"
                        />
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
                              if (
                                !currentBundle ||
                                Number(currentBundle) === 1
                              ) {
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
                            data-testid="create-variant-variant-type-trigger"
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
                      <Form.Label>
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
                          data-testid="create-variant-pack-description-input"
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
                          data-testid="create-variant-bundle-size-input"
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
                          data-testid="create-variant-mrp-input"
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
                                })
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
          </div>
        </RouteFocusModal.Body>

        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
              data-testid="create-variant-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
