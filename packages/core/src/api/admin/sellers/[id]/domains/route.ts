import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../../../modules/domain/service"
import { generateVerificationToken, normalizeDomainName } from "../../../../../utils/dns"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { id: sellerId },
  })
  if (!sellers.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id ${sellerId} was not found`
    )
  }

  const { data: domains, metadata } = await query.graph({
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
    filters: { seller_id: sellerId },
    pagination: req.queryConfig?.pagination,
  })

  res.json({
    domains,
    domain_mappings: domains,
    count: metadata?.count ?? domains.length,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? domains.length,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const sellerId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const domainService = req.scope.resolve<DomainModuleService>(MercurModules.DOMAIN)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { id: sellerId },
  })
  if (!sellers.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id ${sellerId} was not found`
    )
  }

  const body = req.body as {
    domain?: string
    channel_type?: "retail" | "wholesale"
    is_custom_domain?: boolean
    verification_status?: "pending" | "verified" | "failed"
    branding_config?: Record<string, unknown> | null
    subscription_status?: "active" | "inactive" | "trial"
  }

  if (!body?.domain || typeof body.domain !== "string" || !body.domain.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "domain is required"
    )
  }

  const cleanDomain = normalizeDomainName(body.domain)
  const token = generateVerificationToken()

  const isCustom =
    body.is_custom_domain !== undefined
      ? body.is_custom_domain
      : !cleanDomain.endsWith(".threadbuy.com") &&
        !cleanDomain.endsWith(".factorytribe.com")

  const verificationStatus = body.verification_status ?? "pending"
  const verifiedAt = verificationStatus === "verified" ? new Date() : null

  const domainMapping = await domainService.createDomainMappings({
    seller_id: sellerId,
    domain: cleanDomain,
    channel_type: body.channel_type ?? "retail",
    is_custom_domain: isCustom,
    verification_status: verificationStatus,
    verification_token: token,
    verified_at: verifiedAt,
    subscription_status: body.subscription_status ?? "active",
    branding_config: body.branding_config ?? null,
  })

  res.status(201).json({
    domain: domainMapping,
    domain_mapping: domainMapping,
  })
}
