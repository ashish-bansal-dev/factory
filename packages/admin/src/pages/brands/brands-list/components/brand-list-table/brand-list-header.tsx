import { PlusMini } from "@medusajs/icons"
import { Button, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export const BrandListHeader = () => {
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
      <Text size="small" className="text-ui-fg-subtle">
        Manage marketplace brands, review vendor brand requests, and oversee brand attribution.
      </Text>
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
