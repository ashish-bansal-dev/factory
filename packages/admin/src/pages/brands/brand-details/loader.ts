import { LoaderFunctionArgs } from "react-router-dom"
import { brandsQueryKeys } from "@hooks/api/brands"
import { sdk } from "@lib/client"
import { queryClient } from "@lib/query-client"

const brandDetailQuery = (id: string) => ({
  queryKey: brandsQueryKeys.detail(id, { fields: "*products,*sellers" }),
  queryFn: async () =>
    sdk.admin.brands.$id.query({ $id: id, fields: "*products,*sellers" }),
})

export const brandLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const query = brandDetailQuery(id!)

  return queryClient.ensureQueryData(query)
}
