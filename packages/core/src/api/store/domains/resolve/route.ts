import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { normalizeDomainName } from "../../../../utils/dns"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const rawHostname =
    (req.query?.hostname as string | undefined) ||
    ((req as { validatedQuery?: { hostname?: string } }).validatedQuery?.hostname)

  if (!rawHostname || typeof rawHostname !== "string" || !rawHostname.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "hostname parameter is required"
    )
  }

  const normalized = normalizeDomainName(rawHostname)

  const { data: mappings } = await query.graph({
    entity: "domain_mapping",
    fields: [
      "id",
      "seller_id",
      "domain",
      "channel_type",
      "is_custom_domain",
      "verification_status",
      "subscription_status",
      "branding_config",
    ],
    filters: { domain: normalized },
  }).catch(() => ({ data: [] }))

  const mapping = mappings?.[0] as
    | {
        id: string
        seller_id: string
        domain: string
        channel_type: "retail" | "wholesale"
        is_custom_domain: boolean
        verification_status: "pending" | "verified" | "failed"
        branding_config: Record<string, unknown> | null
      }
    | undefined

  if (mapping) {
    if (mapping.verification_status === "verified") {
      const { data: sellers } = await query.graph({
        entity: "seller",
        fields: ["id", "handle", "name"],
        filters: { id: mapping.seller_id },
      }).catch(() => ({ data: [] }))

      const seller = sellers?.[0]
        ? {
            id: sellers[0].id,
            handle: sellers[0].handle,
            name: sellers[0].name,
          }
        : null

      return res.json({
        resolved: true,
        domain: mapping.domain,
        seller_id: mapping.seller_id,
        channel_type: mapping.channel_type,
        is_custom_domain: mapping.is_custom_domain,
        status: mapping.verification_status,
        verification_status: mapping.verification_status,
        branding: mapping.branding_config,
        branding_config: mapping.branding_config,
        seller,
      })
    }

    return res.json({ resolved: false })
  }

  let fallbackChannel: "retail" | "wholesale" | undefined
  let sellerHandle: string | undefined

  if (
    normalized.endsWith(".threadbuy.com") ||
    normalized.endsWith(".threadbuy.local") ||
    normalized.endsWith(".threadbuy.localhost")
  ) {
    fallbackChannel = "retail"
    sellerHandle = normalized
      .replace(/\.threadbuy\.(com|local|localhost)$/, "")
      .trim()
  } else if (
    normalized.endsWith(".factorytribe.com") ||
    normalized.endsWith(".factorytribe.local") ||
    normalized.endsWith(".factorytribe.localhost")
  ) {
    fallbackChannel = "wholesale"
    sellerHandle = normalized
      .replace(/\.factorytribe\.(com|local|localhost)$/, "")
      .trim()
  }

  if (fallbackChannel && sellerHandle) {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "handle", "name"],
      filters: { handle: sellerHandle },
    }).catch(() => ({ data: [] }))

    const seller = sellers?.[0]
    if (seller?.id) {
      return res.json({
        resolved: true,
        domain: normalized,
        seller_id: seller.id,
        channel_type: fallbackChannel,
        is_custom_domain: false,
        status: "verified",
        verification_status: "verified",
        branding: null,
        branding_config: null,
        seller: {
          id: seller.id,
          handle: seller.handle,
          name: seller.name,
        },
      })
    }
  }

  return res.json({ resolved: false })
}
