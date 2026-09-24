import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

interface BackfillDomainSettingsResult {
    migrated_sellers: number
    created_mappings: number
    skipped_mappings: number
    errors: Array<{ seller_id: string; error: string }>
}

interface DomainMappingRecord {
    id: string
    seller_id: string
    domain: string
    channel_type: "retail" | "wholesale"
    is_custom_domain: boolean
    verification_status: "pending" | "verified" | "failed"
    verification_token: string | null
    verified_at: Date | string | null
    subscription_status: string
    branding_config: Record<string, unknown> | string | null
    created_at: Date | string
    updated_at: Date | string
}

interface KnexQueryBuilder {
    where: (clause: Record<string, unknown>) => KnexQueryBuilder
    whereNull: (column: string) => KnexQueryBuilder
    first: () => Promise<Record<string, unknown> | undefined>
    select: (...fields: string[]) => Promise<Record<string, unknown>[]>
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>
    update: (data: Record<string, unknown>) => Promise<unknown>
}

interface KnexClient {
    (table: string): KnexQueryBuilder
}

type BackfillFunction = (args: {
    container: MedusaContainer
    args?: string[]
}) => Promise<BackfillDomainSettingsResult>

const loadBackfillMigration = async (): Promise<BackfillFunction> => {
    const scriptPath = "../../../../packages/core/src/migration-scripts/backfill-domain-settings"
    try {
        const mod = (await import(scriptPath)) as { default?: BackfillFunction } | BackfillFunction
        if (typeof mod === "function") {
            return mod
        }
        if (mod && typeof mod.default === "function") {
            return mod.default
        }
        throw new Error("backfillDomainSettings export not found")
    } catch {
        const pkgMod = (await import("@mercurjs/core/migration-scripts/backfill-domain-settings" as string)) as
            | { default?: BackfillFunction }
            | BackfillFunction
        if (typeof pkgMod === "function") {
            return pkgMod
        }
        if (pkgMod && typeof pkgMod.default === "function") {
            return pkgMod.default
        }
        throw new Error("Could not load backfill-domain-settings migration script")
    }
}

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer }) => {
        describe("Domain Settings Backfill Migration", () => {
            let appContainer: MedusaContainer

            beforeAll(() => {
                appContainer = getContainer()
            })

            it("correctly backfills seller.metadata.domain_settings to DomainMapping records", async () => {
                const knex = appContainer.resolve<KnexClient>(ContainerRegistrationKeys.PG_CONNECTION)
                const tag = `mig_${Date.now()}`

                // 1. Create Seller 1 with verified custom domain and explicit subdomain
                const seller1Seed = await createSellerUser(appContainer, {
                    email: `s1_${tag}@test.com`,
                    name: `Seller One ${tag}`,
                })
                const s1Id = seller1Seed.seller.id
                const s1Handle = `s1-${tag}`.toLowerCase()
                const s1CustomDomain = `custom-brand-${tag}.com`.toLowerCase()
                const s1Subdomain = `sub-brand-${tag}`.toLowerCase()

                await knex("seller")
                    .where({ id: s1Id })
                    .update({
                        handle: s1Handle,
                        metadata: JSON.stringify({
                            domain_settings: {
                                subdomain: s1Subdomain,
                                custom_domain: s1CustomDomain,
                                custom_domain_verified: true,
                                branding: { primary_color: "#123456" },
                            },
                        }),
                    })

                // 2. Create Seller 2 with unverified custom domain and no explicit subdomain (falls back to handle)
                const seller2Seed = await createSellerUser(appContainer, {
                    email: `s2_${tag}@test.com`,
                    name: `Seller Two ${tag}`,
                })
                const s2Id = seller2Seed.seller.id
                const s2Handle = `s2-${tag}`.toLowerCase()
                const s2CustomDomain = `pending-custom-${tag}.com`.toLowerCase()

                await knex("seller")
                    .where({ id: s2Id })
                    .update({
                        handle: s2Handle,
                        metadata: JSON.stringify({
                            domain_settings: {
                                custom_domain: s2CustomDomain,
                                custom_domain_verified: false,
                            },
                        }),
                    })

                // 3. Create Seller 3 with no domain_settings (empty metadata)
                const seller3Seed = await createSellerUser(appContainer, {
                    email: `s3_${tag}@test.com`,
                    name: `Seller Three ${tag}`,
                })
                const s3Id = seller3Seed.seller.id
                const s3Handle = `s3-${tag}`.toLowerCase()

                await knex("seller")
                    .where({ id: s3Id })
                    .update({
                        handle: s3Handle,
                        metadata: JSON.stringify({}),
                    })

                // Execute the backfill migration utility
                const backfillDomainSettings = await loadBackfillMigration()
                const result = await backfillDomainSettings({ container: appContainer, args: [] })

                expect(result).toBeDefined()
                expect(result.migrated_sellers).toBeGreaterThanOrEqual(3)
                expect(result.errors).toHaveLength(0)

                // Query created DomainMapping records for Seller 1
                const s1Mappings = (await knex("domain_mapping")
                    .where({ seller_id: s1Id })
                    .select("*")) as unknown as DomainMappingRecord[]

                expect(s1Mappings.length).toBeGreaterThanOrEqual(3)

                // Verify Seller 1 verified custom domain
                const s1Custom = s1Mappings.find((m) => m.domain === s1CustomDomain)
                expect(s1Custom).toBeDefined()
                expect(s1Custom?.is_custom_domain).toBe(true)
                expect(s1Custom?.verification_status).toBe("verified")
                expect(s1Custom?.channel_type).toBe("wholesale")
                expect(s1Custom?.verified_at).not.toBeNull()

                // Verify Seller 1 retail and wholesale subdomains
                const s1Retail = s1Mappings.find((m) => m.domain === `${s1Subdomain}.threadbuy.com`)
                expect(s1Retail).toBeDefined()
                expect(s1Retail?.is_custom_domain).toBe(false)
                expect(s1Retail?.channel_type).toBe("retail")
                expect(s1Retail?.verification_status).toBe("verified")

                const s1Wholesale = s1Mappings.find((m) => m.domain === `${s1Subdomain}.factorytribe.com`)
                expect(s1Wholesale).toBeDefined()
                expect(s1Wholesale?.is_custom_domain).toBe(false)
                expect(s1Wholesale?.channel_type).toBe("wholesale")
                expect(s1Wholesale?.verification_status).toBe("verified")

                // Query created DomainMapping records for Seller 2
                const s2Mappings = (await knex("domain_mapping")
                    .where({ seller_id: s2Id })
                    .select("*")) as unknown as DomainMappingRecord[]

                const s2Custom = s2Mappings.find((m) => m.domain === s2CustomDomain)
                expect(s2Custom).toBeDefined()
                expect(s2Custom?.is_custom_domain).toBe(true)
                expect(s2Custom?.verification_status).toBe("pending")
                expect(s2Custom?.verified_at).toBeNull()

                // Seller 2 subdomains generated from handle
                const s2Retail = s2Mappings.find((m) => m.domain === `${s2Handle}.threadbuy.com`)
                expect(s2Retail).toBeDefined()
                expect(s2Retail?.channel_type).toBe("retail")

                // Query created DomainMapping records for Seller 3 (empty metadata)
                const s3Mappings = (await knex("domain_mapping")
                    .where({ seller_id: s3Id })
                    .select("*")) as unknown as DomainMappingRecord[]

                const s3Retail = s3Mappings.find((m) => m.domain === `${s3Handle}.threadbuy.com`)
                expect(s3Retail).toBeDefined()
                expect(s3Retail?.channel_type).toBe("retail")

                const s3Wholesale = s3Mappings.find((m) => m.domain === `${s3Handle}.factorytribe.com`)
                expect(s3Wholesale).toBeDefined()
                expect(s3Wholesale?.channel_type).toBe("wholesale")
            })

            it("is strictly idempotent when executed multiple times", async () => {
                const backfillDomainSettings = await loadBackfillMigration()
                const tag = `idem_${Date.now()}`
                await createSellerUser(appContainer, {
                    email: `idem_${tag}@test.com`,
                    name: `Idem Seller ${tag}`,
                })

                // First execution
                const firstRun = await backfillDomainSettings({ container: appContainer, args: [] })
                expect(firstRun.created_mappings).toBeGreaterThan(0)

                // Second execution
                const secondRunResult = await backfillDomainSettings({ container: appContainer, args: [] })

                expect(secondRunResult).toBeDefined()
                expect(secondRunResult.created_mappings).toBe(0)
                expect(secondRunResult.skipped_mappings).toBeGreaterThan(0)
                expect(secondRunResult.errors).toHaveLength(0)
            })

            it("cleans domain protocols, trailing slashes, and paths during backfill", async () => {
                const knex = appContainer.resolve<KnexClient>(ContainerRegistrationKeys.PG_CONNECTION)
                const tag = `clean_${Date.now()}`

                const sellerSeed = await createSellerUser(appContainer, {
                    email: `clean_${tag}@test.com`,
                    name: `Clean Seller ${tag}`,
                })
                const sId = sellerSeed.seller.id
                const dirtyCustomDomain = `https://Clean-Domain-${tag}.com/some/path?query=1`
                const expectedCleanDomain = `clean-domain-${tag}.com`.toLowerCase()

                await knex("seller")
                    .where({ id: sId })
                    .update({
                        handle: `clean-${tag}`.toLowerCase(),
                        metadata: JSON.stringify({
                            domain_settings: {
                                custom_domain: dirtyCustomDomain,
                                custom_domain_verified: true,
                            },
                        }),
                    })

                const backfillDomainSettings = await loadBackfillMigration()
                const result = await backfillDomainSettings({ container: appContainer, args: [] })
                expect(result.errors).toHaveLength(0)

                const mapping = (await knex("domain_mapping")
                    .where({ domain: expectedCleanDomain })
                    .first()) as unknown as DomainMappingRecord | undefined

                expect(mapping).toBeDefined()
                expect(mapping?.seller_id).toBe(sId)
                expect(mapping?.domain).toBe(expectedCleanDomain)
            })
        })
    },
})
