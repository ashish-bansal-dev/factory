import { RouteFocusModal } from "@components/modals"
import { CreateBrandForm } from "./components/create-brand-form"

export const BrandCreate = () => {
  return (
    <RouteFocusModal>
      <CreateBrandForm />
    </RouteFocusModal>
  )
}
