import { useTranslation } from "react-i18next";

import { StatusCell } from "../../common/status-cell";
import { ProductStatus } from "@mercurjs/types";

type ProductStatusCellProps = {
  status?: ProductStatus | `${ProductStatus}` | string | null;
};

export const ProductStatusCell = ({ status }: ProductStatusCellProps) => {
  const { t } = useTranslation();

  if (!status) {
    return <StatusCell color="grey">-</StatusCell>;
  }

  const normalizedStatus = String(status).toLowerCase();

  const statusMap: Record<string, ["grey" | "orange" | "green" | "red", string]> = {
    [ProductStatus.DRAFT]: ["grey", t("products.productStatus.draft")],
    [ProductStatus.PROPOSED]: ["orange", t("products.productStatus.proposed")],
    [ProductStatus.PUBLISHED]: ["green", t("products.productStatus.published")],
    [ProductStatus.REJECTED]: ["red", t("products.productStatus.rejected")],
  };

  const [color, text] = statusMap[normalizedStatus] || ["grey", status];

  return <StatusCell color={color}>{text}</StatusCell>;
};

export const ProductStatusHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.status")}</span>
    </div>
  );
};
