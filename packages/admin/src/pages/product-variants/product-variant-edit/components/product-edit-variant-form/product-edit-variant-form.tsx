import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Divider, Heading, Input, Select, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { HttpTypes } from "@medusajs/types";
import { ProductDTO, AttributeType } from "@mercurjs/types";
import { Form } from "../../../../../components/common/form";
import { AttributeValueInput } from "../../../../../components/inputs/attribute-value-input";
import { CountrySelect } from "../../../../../components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateProductVariant } from "../../../../../hooks/api/products";
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "../../../../../lib/form-helpers";
import { optionalInt } from "../../../../../lib/validation";

type ProductEditVariantFormProps = {
  product: HttpTypes.AdminProduct;
  variant: HttpTypes.AdminProductVariant;
};

const ProductEditVariantSchema = z.object({
  title: z.string().min(1),
  material: z.string().optional(),
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
  options: z.record(z.string(), z.string()).optional(),
  variant_type: z.enum(["retail", "wholesale"]).default("retail"),
  bundle_size: z.union([z.coerce.number().int().min(1), z.literal("")]).default(1),
  pack_description: z.string().optional(),
  mrp: z.union([z.coerce.number().min(0), z.literal("")]).optional(),
});

export const ProductEditVariantForm = ({
  variant,
  product,
}: ProductEditVariantFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const variantAttributes =
    (product as HttpTypes.AdminProduct & Pick<ProductDTO, "attributes">)
      .attributes?.filter((a) => a.is_variant_axis) ?? [];

  // Form fields are keyed by attribute handle/id; the submit payload
  // translates them to option titles (= attribute names) — the shape
  // the stock Medusa variant route expects under `options`. Prefill
  // from the existing variant.options[] (Medusa-side option-value
  // pairing, matched to the attribute by option title = attribute name).
  const defaultOptions = variantAttributes.reduce<Record<string, string>>(
    (acc, attribute) => {
      const key = attribute.handle ?? attribute.id;
      const matched = variant.options?.find(
        (o) => o.option?.title === attribute.name,
      );
      acc[key] = matched?.value ?? "";
      return acc;
    },
    {},
  );

  const initialVariantType =
    (variant.metadata?.variant_type as "retail" | "wholesale" | undefined) ??
    (Number(variant.metadata?.bundle_size) > 1 ? "wholesale" : "retail");
  const initialBundleSize = (variant.metadata?.bundle_size as number | string | undefined) ?? 1;
  const initialPackDescription =
    (variant.metadata?.pack_description as string | undefined) ??
    (variant.metadata?.variant_type === "wholesale" ? "" : "Single pc");
  const initialMrp = variant.metadata?.mrp ?? (variant as any).mrp ?? "";

  const form = useForm<z.infer<typeof ProductEditVariantSchema>>({
    defaultValues: {
      title: variant.title || "",
      material: variant.material || "",
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
    resolver: zodResolver(ProductEditVariantSchema),
  });

  const variantType = form.watch("variant_type");

  const { mutateAsync, isPending } = useUpdateProductVariant(
    variant.product_id!,
    variant.id,
  );

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
    } = data;

    const nullableData = transformNullableFormData(optional);

    // Backend keys options by option title (= attribute name). Form
    // keys by handle/id; remap and drop empties.
    const cleanedOptions = variantAttributes.reduce<Record<string, string>>(
      (acc, attr) => {
        const fieldKey = attr.handle ?? attr.id;
        const v = options?.[fieldKey];
        if (v && attr.name) acc[attr.name] = v;
        return acc;
      },
      {},
    );

    await mutateAsync(
      {
        id: variant.id,
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
          handleSuccess("../");
          toast.success(t("products.variant.edit.success"));
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form} data-testid="product-variant-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
        data-testid="product-variant-edit-keybound-form"
      >
        <RouteDrawer.Body
          className="flex size-full flex-col gap-y-8 overflow-auto"
          data-testid="product-variant-edit-form-body"
        >
          <div
            className="flex flex-col gap-y-4"
            data-testid="product-variant-edit-form-main-fields"
          >
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-title-item">
                    <Form.Label data-testid="product-variant-edit-form-title-label">
                      {t("fields.title")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-title-control">
                      <div data-testid="product-variant-edit-form-title-input-wrapper">
                        <Input
                          {...field}
                          data-testid="product-variant-edit-form-title-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-title-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-material-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-material-label"
                    >
                      {t("fields.material")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-material-control">
                      <div data-testid="product-variant-edit-form-material-input-wrapper">
                        <Input
                          {...field}
                          data-testid="product-variant-edit-form-material-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-material-error" />
                  </Form.Item>
                );
              }}
            />
            {variantAttributes.map((attribute) => {
              const fieldKey = attribute.handle ?? attribute.id;
              return (
                <Form.Field
                  key={attribute.id}
                  control={form.control}
                  name={`options.${fieldKey}`}
                  render={({ field: { value, onChange } }) => {
                    return (
                      <Form.Item
                        data-testid={`product-variant-edit-form-attribute-${attribute.id}-item`}
                      >
                        <Form.Label
                          data-testid={`product-variant-edit-form-attribute-${attribute.id}-label`}
                        >
                          {attribute.name}
                        </Form.Label>
                        <Form.Control
                          data-testid={`product-variant-edit-form-attribute-${attribute.id}-control`}
                        >
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
                        <Form.ErrorMessage
                          data-testid={`product-variant-edit-form-attribute-${attribute.id}-error`}
                        />
                      </Form.Item>
                    );
                  }}
                />
              );
            })}
          </div>
          <Divider data-testid="product-variant-edit-form-divider-channel" />
          <div
            className="flex flex-col gap-y-4"
            data-testid="product-variant-edit-form-channel-section"
          >
            <Heading
              level="h2"
              data-testid="product-variant-edit-form-channel-header"
            >
              {t("products.variant.channel.header", "Channel & Packaging")}
            </Heading>
            <Form.Field
              control={form.control}
              name="variant_type"
              render={({ field: { onChange, ref, ...field } }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-variant-type-item">
                    <Form.Label data-testid="product-variant-edit-form-variant-type-label">
                      {t("products.variants.fields.channel.label", "Sales Channel / Type")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-variant-type-control">
                      <Select
                        {...field}
                        onValueChange={(val: "retail" | "wholesale") => {
                          onChange(val);
                          if (val === "wholesale") {
                            const currentBundle = form.getValues("bundle_size");
                            if (!currentBundle || Number(currentBundle) === 1) {
                              form.setValue("bundle_size", 6);
                            }
                            const currentDesc = form.getValues("pack_description");
                            if (currentDesc === "Single pc") {
                              form.setValue("pack_description", "");
                            }
                          } else if (val === "retail") {
                            const currentBundle = form.getValues("bundle_size");
                            if (Number(currentBundle) === 6) {
                              form.setValue("bundle_size", 1);
                            }
                            const currentDesc = form.getValues("pack_description");
                            if (!currentDesc) {
                              form.setValue("pack_description", "Single pc");
                            }
                          }
                        }}
                        data-testid="product-variant-edit-form-variant-type-select"
                      >
                        <Select.Trigger ref={ref} data-testid="product-variant-edit-form-variant-type-trigger">
                          <Select.Value data-testid="product-variant-edit-form-variant-type-value" />
                        </Select.Trigger>
                        <Select.Content data-testid="product-variant-edit-form-variant-type-content">
                          <Select.Item value="retail" data-testid="product-variant-edit-form-variant-type-retail">
                            {t("products.variants.fields.channel.retail", "Retail (Single)")}
                          </Select.Item>
                          <Select.Item value="wholesale" data-testid="product-variant-edit-form-variant-type-wholesale">
                            {t("products.variants.fields.channel.wholesale", "Wholesale (Pack)")}
                          </Select.Item>
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-variant-type-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="pack_description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-pack-description-item">
                    <Form.Label data-testid="product-variant-edit-form-pack-description-label">
                      {t("products.variants.fields.packDescription", "Pack Description")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-pack-description-control">
                      <div data-testid="product-variant-edit-form-pack-description-input-wrapper">
                        <Input
                          {...field}
                          placeholder={
                            variantType === "wholesale"
                              ? "Sizes 28-32, Pack of 6 (1-2-2-1)"
                              : "Single pc"
                          }
                          data-testid="product-variant-edit-form-pack-description-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-pack-description-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="bundle_size"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-bundle-size-item">
                    <Form.Label data-testid="product-variant-edit-form-bundle-size-label">
                      {t("products.variants.fields.bundleSize", "Bundle / Pack Size")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-bundle-size-control">
                      <div data-testid="product-variant-edit-form-bundle-size-input-wrapper">
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          data-testid="product-variant-edit-form-bundle-size-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-bundle-size-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="mrp"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-mrp-item">
                    <Form.Label optional data-testid="product-variant-edit-form-mrp-label">
                      {t("products.variants.fields.mrp", "MRP")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-mrp-control">
                      <div data-testid="product-variant-edit-form-mrp-input-wrapper">
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          {...field}
                          data-testid="product-variant-edit-form-mrp-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-mrp-error" />
                  </Form.Item>
                );
              }}
            />
          </div>
          <Divider data-testid="product-variant-edit-form-divider-1" />
          <div
            className="flex flex-col gap-y-8"
            data-testid="product-variant-edit-form-inventory-section"
          >
            <div
              className="flex flex-col gap-y-4"
              data-testid="product-variant-edit-form-inventory-fields"
            >
              <Heading
                level="h2"
                data-testid="product-variant-edit-form-inventory-header"
              >
                {t("products.variant.inventory.header")}
              </Heading>
              <Form.Field
                control={form.control}
                name="sku"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-sku-item">
                      <Form.Label
                        optional
                        data-testid="product-variant-edit-form-sku-label"
                      >
                        {t("fields.sku")}
                      </Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-sku-control">
                        <div data-testid="product-variant-edit-form-sku-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-variant-edit-form-sku-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-sku-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="ean"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-ean-item">
                      <Form.Label
                        optional
                        data-testid="product-variant-edit-form-ean-label"
                      >
                        {t("fields.ean")}
                      </Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-ean-control">
                        <div data-testid="product-variant-edit-form-ean-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-variant-edit-form-ean-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-ean-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="upc"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-upc-item">
                      <Form.Label
                        optional
                        data-testid="product-variant-edit-form-upc-label"
                      >
                        {t("fields.upc")}
                      </Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-upc-control">
                        <div data-testid="product-variant-edit-form-upc-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-variant-edit-form-upc-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-upc-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="barcode"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-variant-edit-form-barcode-item">
                      <Form.Label
                        optional
                        data-testid="product-variant-edit-form-barcode-label"
                      >
                        {t("fields.barcode")}
                      </Form.Label>
                      <Form.Control data-testid="product-variant-edit-form-barcode-control">
                        <div data-testid="product-variant-edit-form-barcode-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-variant-edit-form-barcode-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-variant-edit-form-barcode-error" />
                    </Form.Item>
                  );
                }}
              />
            </div>
          </div>
          <Divider data-testid="product-variant-edit-form-divider-2" />
          <div
            className="flex flex-col gap-y-4"
            data-testid="product-variant-edit-form-attributes-section"
          >
            <Heading
              level="h2"
              data-testid="product-variant-edit-form-attributes-header"
            >
              {t("products.attributes")}
            </Heading>
            <Form.Field
              control={form.control}
              name="weight"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-weight-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-weight-label"
                    >
                      {t("fields.weight")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-weight-control">
                      <div data-testid="product-variant-edit-form-weight-input-wrapper">
                        <Input
                          type="number"
                          {...field}
                          data-testid="product-variant-edit-form-weight-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-weight-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="width"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-width-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-width-label"
                    >
                      {t("fields.width")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-width-control">
                      <div data-testid="product-variant-edit-form-width-input-wrapper">
                        <Input
                          type="number"
                          {...field}
                          data-testid="product-variant-edit-form-width-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-width-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="length"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-length-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-length-label"
                    >
                      {t("fields.length")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-length-control">
                      <div data-testid="product-variant-edit-form-length-input-wrapper">
                        <Input
                          type="number"
                          {...field}
                          data-testid="product-variant-edit-form-length-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-length-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="height"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-height-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-height-label"
                    >
                      {t("fields.height")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-height-control">
                      <div data-testid="product-variant-edit-form-height-input-wrapper">
                        <Input
                          type="number"
                          {...field}
                          data-testid="product-variant-edit-form-height-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-height-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-mid-code-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-mid-code-label"
                    >
                      {t("fields.midCode")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-mid-code-control">
                      <div data-testid="product-variant-edit-form-mid-code-input-wrapper">
                        <Input
                          {...field}
                          data-testid="product-variant-edit-form-mid-code-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-mid-code-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-hs-code-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-hs-code-label"
                    >
                      {t("fields.hsCode")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-hs-code-control">
                      <div data-testid="product-variant-edit-form-hs-code-input-wrapper">
                        <Input
                          {...field}
                          data-testid="product-variant-edit-form-hs-code-input"
                        />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-hs-code-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-variant-edit-form-origin-country-item">
                    <Form.Label
                      optional
                      data-testid="product-variant-edit-form-origin-country-label"
                    >
                      {t("fields.countryOfOrigin")}
                    </Form.Label>
                    <Form.Control data-testid="product-variant-edit-form-origin-country-control">
                      <CountrySelect
                        {...field}
                        data-testid="product-variant-edit-form-origin-country-select"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-variant-edit-form-origin-country-error" />
                  </Form.Item>
                );
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-variant-edit-form-footer">
          <div
            className="flex items-center justify-end gap-x-2"
            data-testid="product-variant-edit-form-footer-actions"
          >
            <RouteDrawer.Close
              asChild
              data-testid="product-variant-edit-form-cancel-button-wrapper"
            >
              <Button
                variant="secondary"
                size="small"
                data-testid="product-variant-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              type="submit"
              size="small"
              isLoading={isPending}
              data-testid="product-variant-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
