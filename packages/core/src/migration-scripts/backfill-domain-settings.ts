import crypto from "crypto"
import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export interface BackfillDomainSettingsResult {
  migrated_sellers: number
  created_mappings: number
  skipped_mappings: number
  errors: Array<{ seller_id: string; error: string }>
}

interface SellerRecord {
  id: string
  handle: string | null
  metadata: string | Record<string, unknown> | null
}

interface DomainSettings {
  subdomain?: string
  custom_domain?: string
  custom_domain_verified?: boolean
  branding?: Record<string, unknown>
}

interface DomainMappingRow {
  id: string
  seller_id: string
  domain: string
  channel_type: "retail" | "wholesale"
  is_custom_domain: boolean
  verification_status: "pending" | "verified" | "failed"
  verification_token: string | null
  verified_at: Date | null
  subscription_status: "active" | "inactive" | "trial"
  branding_config: string | null
}

function cleanDomain(raw: string): string {
  return raw
    .replace(/^[a-zA-Z]+:\/\//, "")
    .split("/")[0]
    .trim()
    .toLowerCase()
}

export default async function backfillDomainSettings({
  container,
}: ExecArgs): Promise<BackfillDomainSettingsResult> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const result: BackfillDomainSettingsResult = {
    migrated_sellers: 0,
    created_mappings: 0,
    skipped_mappings: 0,
    errors: [],
  }

  const sellers: SellerRecord[] = await knex("seller")
    .whereNull("deleted_at")
    .select("id", "handle", "metadata")

  for (const seller of sellers) {
    try {
      let metadata: Record<string, unknown> = {}
      if (typeof seller.metadata === "string") {
        try {
          metadata = JSON.parse(seller.metadata) as Record<string, unknown>
        } catch {
          metadata = {}
        }
      } else if (seller.metadata && typeof seller.metadata === "object") {
        metadata = seller.metadata as Record<string, unknown>
      }

      const domainSettings =
        (metadata.domain_settings as DomainSettings | undefined) ?? {}
      const subdomain = domainSettings.subdomain || seller.handle

      const toInsert: DomainMappingRow[] = []

      if (domainSettings.custom_domain) {
        const cleanedCustom = cleanDomain(domainSettings.custom_domain)
        if (cleanedCustom) {
          const isVerified = Boolean(domainSettings.custom_domain_verified)
          toInsert.push({
            id: `dom_${crypto.randomBytes(12).toString("hex")}`,
            seller_id: seller.id,
            domain: cleanedCustom,
            channel_type: "wholesale",
            is_custom_domain: true,
            verification_status: isVerified ? "verified" : "pending",
            verification_token: crypto.randomBytes(16).toString("hex"),
            verified_at: isVerified ? new Date() : null,
            subscription_status: "active",
            branding_config: domainSettings.branding
              ? JSON.stringify(domainSettings.branding)
              : null,
          })
        }
      }

      if (subdomain) {
        const cleanSub = subdomain.trim().toLowerCase()
        if (cleanSub) {
          toInsert.push({
            id: `dom_${crypto.randomBytes(12).toString("hex")}`,
            seller_id: seller.id,
            domain: `${cleanSub}.factorytribe.com`,
            channel_type: "wholesale",
            is_custom_domain: false,
            verification_status: "verified",
            verification_token: null,
            verified_at: new Date(),
            subscription_status: "active",
            branding_config: null,
          })

          toInsert.push({
            id: `dom_${crypto.randomBytes(12).toString("hex")}`,
            seller_id: seller.id,
            domain: `${cleanSub}.threadbuy.com`,
            channel_type: "retail",
            is_custom_domain: false,
            verification_status: "verified",
            verification_token: null,
            verified_at: new Date(),
            subscription_status: "active",
            branding_config: null,
          })
        }
      }

      for (const mapping of toInsert) {
        const existing = await knex("domain_mapping")
          .where({ domain: mapping.domain })
          .first()

        if (!existing) {
          await knex("domain_mapping").insert({
            ...mapping,
            created_at: new Date(),
            updated_at: new Date(),
          })
          result.created_mappings++
        } else {
          result.skipped_mappings++
        }
      }

      result.migrated_sellers++
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      result.errors.push({
        seller_id: seller.id,
        error: errorMsg,
      })
    }
  }

  return result
}
