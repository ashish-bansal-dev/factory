import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../../../../modules/domain/service"
import {
  generateVerificationToken,
  normalizeDomainName,
} from "../../../../../../utils/dns"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: sellerId, domain_id: domainId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: mappings } = await query.graph({
    entity: "domain_mapping",
    fields: [
      "id",
      "seller_id",
      "domain",
      "channel_type",
      "is_custom_domain",
      "verification_status",
      "verification_token",
      "verified_at",
      "subscription_status",
      "branding_config",
      "created_at",
      "updated_at",
    ],
    filters: { id: domainId, seller_id: sellerId },
  })

  if (!mappings.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Domain mapping with id ${domainId} was not found for seller ${sellerId}`
    )
  }

  res.status(200).json({
    domain: mappings[0],
    domain_mapping: mappings[0],
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: sellerId, domain_id: domainId } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const domainService = req.scope.resolve<DomainModuleService>(MercurModules.DOMAIN)

  const { data: mappings } = await query.graph({
    entity: "domain_mapping",
    fields: [
      "id",
      "seller_id",
      "domain",
      "channel_type",
      "is_custom_domain",
      "verification_status",
      "verification_token",
      "verified_at",
      "subscription_status",
      "branding_config",
    ],
    filters: { id: domainId, seller_id: sellerId },
  })

  if (!mappings.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Domain mapping with id ${domainId} was not found for seller ${sellerId}`
    )
  }

  const existingMapping = mappings[0]

  const body = (req.body || {}) as {
    domain?: string
    channel_type?: "retail" | "wholesale"
    is_custom_domain?: boolean
    verification_status?: "pending" | "verified" | "failed"
    branding_config?: Record<string, unknown> | null
    subscription_status?: "active" | "inactive" | "trial"
  }

  const updateData: Record<string, unknown> = {
    id: domainId,
  }

  if (body.domain !== undefined) {
    const cleanDomain = normalizeDomainName(body.domain)
    if (!cleanDomain) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "domain cannot be empty"
      )
    }

    if (cleanDomain !== existingMapping.domain) {
      const { data: existingWithDomain } = await query.graph({
        entity: "domain_mapping",
        fields: ["id"],
        filters: { domain: cleanDomain },
      })
      const conflict = existingWithDomain.find((d) => d.id !== domainId)
      if (conflict) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          `Domain ${cleanDomain} is already registered`
        )
      }

      updateData.domain = cleanDomain
      updateData.verification_token = generateVerificationToken()
      updateData.verification_status = body.verification_status ?? "pending"
      updateData.verified_at =
        body.verification_status === "verified" ? new Date() : null

      if (body.is_custom_domain === undefined) {
        updateData.is_custom_domain =
          !cleanDomain.endsWith(".threadbuy.com") &&
          !cleanDomain.endsWith(".factorytribe.com")
      }
    }
  }

  if (body.channel_type !== undefined) {
    updateData.channel_type = body.channel_type
  }
  if (body.is_custom_domain !== undefined) {
    updateData.is_custom_domain = body.is_custom_domain
  }
  if (
    body.verification_status !== undefined &&
    updateData.verification_status === undefined
  ) {
    updateData.verification_status = body.verification_status
    updateData.verified_at =
      body.verification_status === "verified" ? new Date() : null
  }
  if (body.subscription_status !== undefined) {
    updateData.subscription_status = body.subscription_status
  }
  if (body.branding_config !== undefined) {
    updateData.branding_config = body.branding_config
  }

  const updatedMapping = await domainService.updateDomainMappings(updateData)

  res.status(200).json({
    domain: updatedMapping,
    domain_mapping: updatedMapping,
  })
}

export const PUT = POST

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id: sellerId, domain_id: domainId } = req.params
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
      `Domain mapping with id ${domainId} was not found for seller ${sellerId}`
    )
  }

  await domainService.deleteDomainMappings(domainId)

  res.status(200).json({
    id: domainId,
    object: "domain_mapping",
    deleted: true,
  })
}
