import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../../../../../modules/domain/service"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: sellerId, domain_id: domainId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const domainService = req.scope.resolve<DomainModuleService>(MercurModules.DOMAIN)

  const { data: mappings } = await query.graph({
    entity: "domain_mapping",
    fields: ["id", "seller_id", "domain"],
    filters: { id: domainId, seller_id: sellerId },
  })

  if (!mappings.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Domain mapping with id ${domainId} was not found for seller ${sellerId}`
    )
  }

  const updated = await domainService.updateDomainMappings({
    id: domainId,
    verification_status: "verified",
    verified_at: new Date(),
  })

  res.status(200).json({
    domain: updated,
    domain_mapping: updated,
  })
}
