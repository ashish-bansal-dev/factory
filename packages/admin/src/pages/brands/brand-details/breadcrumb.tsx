import { UIMatch } from "react-router-dom"
import { AdminBrandResponse } from "@mercurjs/types"
import { useBrand } from "@hooks/api/brands"

type BrandDetailBreadcrumbProps = UIMatch<AdminBrandResponse>

export const BrandDetailBreadcrumb = (props: BrandDetailBreadcrumbProps) => {
  const { id } = props.params

  const { brand } = useBrand(
    id!,
    undefined,
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  )

  if (!brand) {
    return null
  }

  return <span>{brand.name}</span>
}
