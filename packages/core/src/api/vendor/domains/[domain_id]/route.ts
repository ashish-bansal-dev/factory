import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../../modules/domain/service"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Seller context is required"
    )
  }

  const { domain_id: domainId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const domainService = req.scope.resolve<DomainModuleService>(MercurModules.DOMAIN)

  const { data: mappings } = await query.graph({
    entity: "domain_mapping",
    fields: ["id", "seller_id"],
    filters: { id: domainId, seller_id: sellerId },
  })

  if (!mappings.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Domain mapping with id ${domainId} was not found`
    )
  }

  await domainService.deleteDomainMappings(domainId)

  res.status(200).json({
    id: domainId,
    object: "domain_mapping",
    deleted: true,
  })
}
