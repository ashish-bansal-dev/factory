import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "../../../modules/domain/service"
import { generateVerificationToken, normalizeDomainName } from "../../../utils/dns"

export const GET = async (
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

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
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
  const sellerId = req.seller_context?.seller_id
  if (!sellerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Seller context is required"
    )
  }

  const domainService = req.scope.resolve<DomainModuleService>(MercurModules.DOMAIN)

  const body = req.body as {
    domain?: string
    channel_type?: "retail" | "wholesale"
    is_custom_domain?: boolean
    branding_config?: Record<string, unknown> | null
  }

  if (!body?.domain || typeof body.domain !== "string" || !body.domain.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "domain is required"
    )
  }

  const cleanDomain = normalizeDomainName(body.domain)
  const token = generateVerificationToken()

  const domainMapping = await domainService.createDomainMappings({
    seller_id: sellerId,
    domain: cleanDomain,
    channel_type: body.channel_type ?? "retail",
    is_custom_domain: body.is_custom_domain ?? true,
    verification_status: "pending",
    verification_token: token,
    verified_at: null,
    subscription_status: "active",
    branding_config: body.branding_config ?? null,
  })

  res.status(201).json({
    domain: domainMapping,
    domain_mapping: domainMapping,
  })
}
