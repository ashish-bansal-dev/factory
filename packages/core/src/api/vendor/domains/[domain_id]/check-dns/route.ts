import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../../../modules/domain/service"
import { verifyDomainDns } from "../../../../../utils/dns"

export const POST = async (
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
    fields: [
      "id",
      "seller_id",
      "domain",
      "verification_token",
      "verification_status",
    ],
    filters: { id: domainId, seller_id: sellerId },
  })

  if (!mappings.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Domain mapping with id ${domainId} was not found`
    )
  }

  const mapping = mappings[0] as {
    id: string
    seller_id: string
    domain: string
    verification_token: string | null
    verification_status: string
  }
  const token = mapping.verification_token || ""

  const checkResult = await verifyDomainDns({
    domain: mapping.domain,
    verificationToken: token,
  })

  let updated = mapping
  if (checkResult.verified) {
    updated = (await domainService.updateDomainMappings({
      id: domainId,
      verification_status: "verified",
      verified_at: new Date(),
    })) as typeof mapping
  } else {
    updated = (await domainService.updateDomainMappings({
      id: domainId,
      verification_status: "failed",
    })) as typeof mapping
  }

  res.status(200).json({
    verified: checkResult.verified,
    domain: updated,
    domain_mapping: updated,
    status: updated.verification_status,
    message: checkResult.message,
    records: checkResult.recordsFound,
  })
}
