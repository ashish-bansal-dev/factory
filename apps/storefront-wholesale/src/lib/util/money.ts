import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code = "inr",
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
  locale,
}: ConvertToLocaleParams) => {
  const code = (currency_code || "inr").toLowerCase()
  const effectiveLocale = locale || (code === "inr" ? "en-IN" : "en-US")

  return code && !isEmpty(code)
    ? new Intl.NumberFormat(effectiveLocale, {
        style: "currency",
        currency: code.toUpperCase(),
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}
