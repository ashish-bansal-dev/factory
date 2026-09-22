import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@medusajs/ui";

import { SellerStatusCell } from "../../../components/table/table-cells/seller/seller-status-cell/seller-status-cell";
import { DateCell } from "@/components/table/table-cells/common/date-cell";
import { SellerDTO, SellerStatus } from "@mercurjs/types";

const columnHelper = createColumnHelper<SellerDTO>();

export const useSellersTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.display({
        id: "name",
        header: t("stores.fields.seller"),
        cell: ({ row }) => row.original.name,
      }),
      columnHelper.display({
        id: "email",
        header: t("stores.fields.email"),
        cell: ({ row }) => row.original.email,
      }),
      columnHelper.display({
        id: "domain",
        header: "Storefront Domain",
        cell: ({ row }) => {
          const seller = row.original;
          const domainSettings = (seller.metadata as Record<string, any>)?.domain_settings;
          const hasPending = domainSettings?.subdomain_request?.status === "pending";
          const baseDomain =
            typeof window !== "undefined" && window.location.hostname === "localhost"
              ? "localhost:8000"
              : "factorytribe.com";
          const subdomain = `${seller.handle}.${baseDomain}`;
          return (
            <div className="flex items-center gap-x-2">
              <span className="font-mono text-xs text-ui-fg-subtle">{subdomain}</span>
              {hasPending && (
                <Badge size="2xsmall" color="orange">Pending Request</Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.type ? (
            <Badge size="2xsmall" color="blue" className="capitalize">
              {row.original.type}
            </Badge>
          ) : (
            <span className="text-ui-fg-muted">-</span>
          ),
      }),
      columnHelper.display({
        id: "status",
        header: t("fields.status"),
        cell: ({ row }) => {
          return (
            <SellerStatusCell
              status={row.original.status as SellerStatus}
            />
          );
        },
      }),
      columnHelper.display({
        id: "is_premium",
        header: t("stores.fields.premium"),
        cell: ({ row }) => (
          <span className="text-ui-fg-subtle">
            {row.original.is_premium
              ? t("stores.premium.yes")
              : t("stores.premium.no")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "created_at",
        header: t("fields.createdAt"),
        cell: ({ row }) => {
          return <DateCell date={row.original.created_at} />;
        },
      }),
    ],
    [t],
  );
};
