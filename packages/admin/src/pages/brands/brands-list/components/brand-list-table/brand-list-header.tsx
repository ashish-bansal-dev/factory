import { PlusMini } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const BrandListHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <BrandListTitle />
      <BrandListActions />
    </div>
  )
}

export const BrandListTitle = () => {
  return (
    <div>
      <Heading>Brands</Heading>
    </div>
  )
}

export const BrandListActions = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-x-2">
      <Button size="small" variant="secondary" asChild>
        <Link to="create">
          <PlusMini />
          {t("actions.create")}
        </Link>
      </Button>
    </div>
  )
}
