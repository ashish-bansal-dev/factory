import { useParams } from "react-router-dom"
import { RouteDrawer } from "@components/modals"
import { useBrand } from "@hooks/api/brands"
import { EditBrandForm } from "./components/edit-brand-form"

export const BrandEdit = () => {
  const { id } = useParams()
  const { brand, isLoading } = useBrand(id!)

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title>Edit Brand</RouteDrawer.Title>
        <RouteDrawer.Description>
          Update brand details and manage assigned sellers.
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {isLoading || !brand ? (
        <div className="p-6 text-ui-fg-muted">Loading...</div>
      ) : (
        <EditBrandForm brand={brand} />
      )}
    </RouteDrawer>
  )
}
