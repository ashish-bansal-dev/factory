import { Outlet, useLoaderData, useParams } from "react-router-dom"
import { useBrand } from "@hooks/api/brands"
import { TwoColumnPageSkeleton } from "@components/common/skeleton"
import { TwoColumnPage } from "@components/layout/pages"
import { BrandGeneralSection } from "./components/brand-general-section"
import { BrandSellersSection } from "./components/brand-sellers-section"
import { brandLoader } from "./loader"

export const BrandDetail = () => {
  const { id } = useParams()
  const initialData = useLoaderData() as Awaited<ReturnType<typeof brandLoader>>
  const { brand, isLoading } = useBrand(
    id!,
    undefined,
    {
      initialData,
    }
  )

  if (isLoading || !brand) {
    return (
      <TwoColumnPageSkeleton
        mainSections={2}
        sidebarSections={1}
        showJSON
        showMetadata
      />
    )
  }

  return (
    <TwoColumnPage
      data={brand}
      showJSON
      showMetadata
    >
      <TwoColumnPage.Main>
        <BrandGeneralSection brand={brand} />
        <BrandSellersSection brand={brand} />
      </TwoColumnPage.Main>
      <Outlet />
    </TwoColumnPage>
  )
}
