import { HttpTypes } from "@medusajs/types";
import { usePermissions } from "@mercurjs/dashboard-shared";
import { Badge, toast } from "@medusajs/ui";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  createDataGridHelper,
  createDataGridLocationStockColumns,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../components/data-grid";
import { Thumbnail } from "../../../../components/common/thumbnail";
import { useRouteModal } from "../../../../components/modals";
import { defineTabMeta } from "../../../../components/tabbed-form/types";
import { usePricePreferences } from "../../../../hooks/api/price-preferences";
import { useOfferConditions } from "../../../../hooks/api/offer-conditions";
import { useCurrentSeller } from "../../../../hooks/api/sellers";
import { useShippingProfiles } from "../../../../hooks/api/shipping-profiles";
import { useStockLocations } from "../../../../hooks/api/stock-locations";
import { CreateOfferFormValues, OfferVariantRow } from "./schema";

type ShippingProfileLite = {
  id: string;
  name?: string | null;
  type?: string | null;
};
type OfferConditionLite = { id: string; label: string };

/**
 * The grid interleaves a non-editable product "group" row above each
 * product's variants (SPEC-009 / Figma `40016485:530743`). The form's
 * `variants` array stays variant-only; each variant grid row carries its
 * `__formIndex` so field paths bind to the right form entry regardless of
 * the interleaved group rows.
 */
type ProductGroupRow = {
  __group: true;
  id: string;
  product_title: string;
};
type VariantGridRow = OfferVariantRow & {
  __group?: false;
  __formIndex: number;
};
type GridRow = ProductGroupRow | VariantGridRow;

const isGroup = (row: GridRow): row is ProductGroupRow =>
  (row as ProductGroupRow).__group === true;

const Root = () => {
  const form = useFormContext<CreateOfferFormValues>();
  const { setCloseOnEscape } = useRouteModal();

  const { currency_code, seller } = useCurrentSeller();
  const isRetailer = seller?.type === "retailer";
  const { can } = usePermissions();
  const channel = (useWatch({
    control: form.control,
    name: "channel",
  }) ?? "retail") as "retail" | "wholesale";

  const { stock_locations } = useStockLocations(
    { limit: 100 },
    { enabled: can("stock_locations") }
  );
  const { shipping_profiles } = useShippingProfiles(
    { limit: 100 },
    { enabled: can("shipping_profiles") }
  ) as {
    shipping_profiles?: ShippingProfileLite[];
  };
  const { offer_conditions } = useOfferConditions();
  const { price_preferences: pricePreferences } = usePricePreferences(
    {},
    { enabled: can("price_preferences") }
  );

  const variants = useWatch({
    control: form.control,
    name: "variants",
  }) as OfferVariantRow[] | undefined;

  const filteredShippingProfiles = useMemo(() => {
    const profiles = shipping_profiles ?? [];
    if (channel !== "wholesale") return profiles;
    const freight = profiles.filter((p) =>
      (p.name && /freight/i.test(p.name)) ||
      (p.type && /freight/i.test(p.type))
    );
    return freight.length > 0 ? freight : profiles;
  }, [shipping_profiles, channel]);

  const handleChannelChange = (newChannel: "retail" | "wholesale") => {
    if (newChannel === "wholesale" && isRetailer) {
      toast.error("Retailer accounts can only create retail offers.");
      return;
    }
    form.setValue("channel", newChannel);
    if (newChannel === "wholesale") {
      const current = form.getValues("variants") ?? [];
      const updated = current.map((v) => ({
        ...v,
        bundle_size: (!v.bundle_size || v.bundle_size === 1) ? 6 : v.bundle_size,
      }));
      form.setValue("variants", updated);
    }
  };

  const gridData = useMemo<GridRow[]>(() => {
    const rows: GridRow[] = [];
    let lastProductId: string | undefined;
    (variants ?? []).forEach((variant, index) => {
      if (variant.product_id !== lastProductId) {
        rows.push({
          __group: true,
          id: `group-${variant.product_id}`,
          product_title: variant.product_title,
        });
        lastProductId = variant.product_id;
      }
      rows.push({ ...variant, __group: false, __formIndex: index });
    });
    return rows;
  }, [variants]);

  const columns = useColumns({
    currencyCode: currency_code,
    channel,
    stockLocations: stock_locations as
      | HttpTypes.AdminStockLocation[]
      | undefined,
    shippingProfiles: filteredShippingProfiles,
    offerConditions: offer_conditions ?? [],
    pricePreferences,
  });

  return (
    <div
      className="flex size-full flex-col overflow-hidden"
      data-testid="offer-create-tab-stockLevelsAndPrices"
    >
      {/* Channel selector toolbar */}
      <div className="flex items-center justify-between border-b border-ui-border-base px-6 py-2.5 bg-ui-bg-subtle/50">
        <div className="flex items-center gap-x-3">
          <span className="text-xs font-medium text-ui-fg-subtle">Channel:</span>
          <div className="inline-flex rounded-lg border border-ui-border-base bg-ui-bg-base p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => handleChannelChange("retail")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                channel === "retail"
                  ? "bg-ui-bg-interactive text-ui-fg-on-color"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              Retail (ThreadBuy)
            </button>
            <button
              type="button"
              disabled={isRetailer}
              onClick={() => handleChannelChange("wholesale")}
              title={isRetailer ? "Retailer accounts can only create retail offers." : undefined}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                channel === "wholesale"
                  ? "bg-ui-bg-interactive text-ui-fg-on-color"
                  : isRetailer
                  ? "text-ui-fg-disabled cursor-not-allowed opacity-50"
                  : "text-ui-fg-muted hover:text-ui-fg-base"
              }`}
            >
              Wholesale (FactoryTribe)
            </button>
          </div>
          {isRetailer && (
            <span className="text-[11px] text-ui-fg-muted italic">
              Retailer accounts can only create retail offers
            </span>
          )}
        </div>
        {channel === "wholesale" && (
          <div className="flex items-center gap-2">
            <Badge color="purple" size="2xsmall">
              Wholesale: Pack Size &ge; 1 + Freight Shipping
            </Badge>
          </div>
        )}
      </div>

      <DataGrid
        columns={columns}
        data={gridData}
        state={form}
        onEditingChange={(editing) => setCloseOnEscape(!editing)}
      />
    </div>
  );
};

type ColumnArgs = {
  currencyCode?: string;
  channel?: "retail" | "wholesale";
  stockLocations?: HttpTypes.AdminStockLocation[];
  shippingProfiles?: ShippingProfileLite[];
  offerConditions?: OfferConditionLite[];
  pricePreferences?: HttpTypes.AdminPricePreference[];
};

const columnHelper = createDataGridHelper<GridRow, CreateOfferFormValues>();

const useColumns = ({
  currencyCode,
  channel = "retail",
  stockLocations = [],
  shippingProfiles = [],
  offerConditions = [],
  pricePreferences = [],
}: ColumnArgs) => {
  const { t } = useTranslation();

  return useMemo(() => {
    const shippingProfileOptions = shippingProfiles.map((p) => ({
      value: p.id,
      label: p.name ?? p.id,
    }));
    const conditionOptions = offerConditions.map((c) => ({
      value: c.id,
      label: c.label,
    }));
    const currencies = currencyCode ? [currencyCode] : [];

    return [
      columnHelper.column({
        id: "title",
        header: t("fields.title"),
        cell: (context) => {
          const row = context.row.original;
          if (isGroup(row)) {
            return (
              <DataGrid.ReadonlyCell context={context}>
                <span
                  className="text-ui-fg-subtle truncate font-medium"
                  title={row.product_title}
                >
                  {row.product_title}
                </span>
              </DataGrid.ReadonlyCell>
            );
          }
          const title = row.variant_title || "";
          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <Thumbnail src={row.product_thumbnail ?? null} />
                <span className="truncate" title={title}>
                  {title}
                </span>
              </div>
            </DataGrid.ReadonlyCell>
          );
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        field: (context) => {
          const row = context.row.original;
          return isGroup(row) ? null : `variants.${row.__formIndex}.sku`;
        },
        type: "text",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : (
            <DataGrid.TextCell context={context} />
          ),
      }),
      columnHelper.column({
        id: "mrp",
        name: "MRP",
        header: "MRP (Optional)",
        field: (context) => {
          const row = context.row.original;
          return isGroup(row) ? null : `variants.${row.__formIndex}.mrp`;
        },
        type: "number",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : currencyCode ? (
            <DataGrid.CurrencyCell
              context={context}
              code={currencyCode}
            />
          ) : (
            <DataGrid.NumberCell
              context={context}
              min={0}
              placeholder="Optional"
            />
          ),
      }),
      columnHelper.column({
        id: "shipping_profile",
        name: t("offers.fields.shippingProfile"),
        header: t("offers.fields.shippingProfile"),
        field: (context) => {
          const row = context.row.original;
          return isGroup(row)
            ? null
            : `variants.${row.__formIndex}.shipping_profile_id`;
        },
        type: "select",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : (
            <DataGrid.SelectCell
              context={context}
              options={shippingProfileOptions}
              placeholder=""
            />
          ),
      }),
      columnHelper.column({
        id: "condition",
        name: t("offers.fields.condition"),
        header: t("offers.fields.condition"),
        field: (context) => {
          const row = context.row.original;
          return isGroup(row) ? null : `variants.${row.__formIndex}.condition_id`;
        },
        type: "select",
        cell: (context) =>
          isGroup(context.row.original) ? (
            <DataGrid.ReadonlyCell context={context} />
          ) : (
            <DataGrid.SelectCell
              context={context}
              options={conditionOptions}
              placeholder=""
            />
          ),
      }),
      ...createDataGridLocationStockColumns<GridRow, CreateOfferFormValues>({
        stockLocations,
        isReadyOnly: (context) => isGroup(context.row.original),
        getFieldName: (context, index) => {
          const row = context.row.original;
          if (isGroup(row)) return null;
          const location = stockLocations[index];
          if (!location) return null;
          return `variants.${row.__formIndex}.inventory.${location.id}`;
        },
        t,
      }),
      ...createDataGridPriceColumns<GridRow, CreateOfferFormValues>({
        currencies,
        pricePreferences,
        isReadyOnly: (context) => isGroup(context.row.original),
        getFieldName: (context, value) => {
          const row = context.row.original;
          if (isGroup(row)) return null;
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${row.__formIndex}.prices.${value}`;
          }
          return null;
        },
        t,
      }),
      ...(channel === "wholesale"
        ? [
            columnHelper.column({
              id: "bundle_size",
              name: "Pack Size",
              header: "Pack Size",
              field: (context) => {
                const row = context.row.original;
                return isGroup(row)
                  ? null
                  : `variants.${row.__formIndex}.bundle_size`;
              },
              type: "number",
              cell: (context) =>
                isGroup(context.row.original) ? (
                  <DataGrid.ReadonlyCell context={context} />
                ) : (
                  <DataGrid.NumberCell
                    context={context}
                    min={1}
                    placeholder="4"
                  />
                ),
            }),
          ]
        : []),
    ];
  }, [
    t,
    currencyCode,
    channel,
    stockLocations,
    shippingProfiles,
    offerConditions,
    pricePreferences,
  ]);
};

Root._tabMeta = defineTabMeta<CreateOfferFormValues>({
  id: "stockLevelsAndPrices",
  labelKey: "offers.create.tabs.stockLevelsAndPrices",
});

export const CreateOfferStockLevelsAndPricesTab = Root;
