import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"

interface StoreDomainResolutionResponse {
    resolved: boolean
    seller_id?: string | null
    seller?: {
        id: string
        handle?: string
        name?: string
        [key: string]: unknown
    } | null
    channel_type?: "retail" | "wholesale" | null
    domain?: string
    is_custom_domain?: boolean
    verification_status?: "pending" | "verified" | "failed" | null
    branding_config?: Record<string, unknown> | null
    [key: string]: unknown
}

interface ApiDomainErrorResponse {
    response?: {
        status: number
        data?: {
            message?: string
            type?: string
        }
    }
}

interface StoreHeadersWrapper {
    headers: {
        "x-publishable-api-key": string
        [key: string]: string
    }
}

interface KnexClient {
    (table: string): {
        insert: (data: Record<string, unknown> | Record<string, unknown>[]) => Promise<unknown>
        where: (clause: Record<string, unknown>) => {
            first: () => Promise<Record<string, unknown> | undefined>
            select: (...fields: string[]) => Promise<Record<string, unknown>[]>
        }
    }
}

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Domain Resolution (/store/domains/resolve)", () => {
            let appContainer: MedusaContainer
            let storeHeaders: StoreHeadersWrapper

            let seedCounter = 0
            const setupSellerWithDomains = async () => {
                const idx = ++seedCounter
                const tag = `dr_${idx}_${Date.now()}`
                const handle = `brand${tag}`.toLowerCase()

                const sellerSeed = await createSellerUser(appContainer, {
                    email: `seller_${tag}@test.com`,
                    name: `Brand ${tag}`,
                })

                const sellerId = sellerSeed.seller.id
                const knex = appContainer.resolve<KnexClient>(ContainerRegistrationKeys.PG_CONNECTION)

                const retailDomain = `${handle}.threadbuy.com`
                const wholesaleDomain = `${handle}.factorytribe.com`
                const customDomain = `wholesale.${handle}-supply.com`
                const unverifiedDomain = `unverified.${handle}-store.com`

                await knex("domain_mapping").insert([
                    {
                        id: `dom_ret_${tag}`,
                        seller_id: sellerId,
                        domain: retailDomain,
                        channel_type: "retail",
                        is_custom_domain: false,
                        verification_status: "verified",
                        verified_at: new Date(),
                        subscription_status: "active",
                        branding_config: JSON.stringify({ primary_color: "#ff0000" }),
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                    {
                        id: `dom_ws_${tag}`,
                        seller_id: sellerId,
                        domain: wholesaleDomain,
                        channel_type: "wholesale",
                        is_custom_domain: false,
                        verification_status: "verified",
                        verified_at: new Date(),
                        subscription_status: "active",
                        branding_config: JSON.stringify({ primary_color: "#0000ff" }),
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                    {
                        id: `dom_custom_${tag}`,
                        seller_id: sellerId,
                        domain: customDomain,
                        channel_type: "wholesale",
                        is_custom_domain: true,
                        verification_status: "verified",
                        verified_at: new Date(),
                        subscription_status: "active",
                        branding_config: null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                    {
                        id: `dom_unverified_${tag}`,
                        seller_id: sellerId,
                        domain: unverifiedDomain,
                        channel_type: "retail",
                        is_custom_domain: true,
                        verification_status: "pending",
                        verified_at: null,
                        subscription_status: "trial",
                        branding_config: null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                ])

                return {
                    sellerId,
                    handle,
                    retailDomain,
                    wholesaleDomain,
                    customDomain,
                    unverifiedDomain,
                    tag,
                }
            }

            beforeAll(() => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey }) as StoreHeadersWrapper
            })

            it("resolves retail subdomain (*.threadbuy.com) to correct seller and retail channel", async () => {
                const fixture = await setupSellerWithDomains()

                const response = await api.get(
                    `/store/domains/resolve?hostname=${fixture.retailDomain}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(true)
                expect(data.seller_id).toBe(fixture.sellerId)
                expect(data.channel_type).toBe("retail")
                expect(data.is_custom_domain).toBe(false)
            })

            it("resolves wholesale subdomain (*.factorytribe.com) to correct seller and wholesale channel", async () => {
                const fixture = await setupSellerWithDomains()

                const response = await api.get(
                    `/store/domains/resolve?hostname=${fixture.wholesaleDomain}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(true)
                expect(data.seller_id).toBe(fixture.sellerId)
                expect(data.channel_type).toBe("wholesale")
                expect(data.is_custom_domain).toBe(false)
            })

            it("resolves verified custom domain to correct seller and channel", async () => {
                const fixture = await setupSellerWithDomains()

                const response = await api.get(
                    `/store/domains/resolve?hostname=${fixture.customDomain}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(true)
                expect(data.seller_id).toBe(fixture.sellerId)
                expect(data.channel_type).toBe("wholesale")
                expect(data.is_custom_domain).toBe(true)
            })

            it("does not resolve unverified custom domain", async () => {
                const fixture = await setupSellerWithDomains()

                const response = await api.get(
                    `/store/domains/resolve?hostname=${fixture.unverifiedDomain}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(false)
            })

            it("returns resolved: false for unknown / unregistered hostname", async () => {
                const response = await api.get(
                    `/store/domains/resolve?hostname=completely-unknown-domain-12345.com`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(false)
            })

            it("normalizes hostname with protocol, port, and uppercase casing", async () => {
                const fixture = await setupSellerWithDomains()
                const rawHostname = `https://${fixture.retailDomain.toUpperCase()}:8080/`

                const response = await api.get(
                    `/store/domains/resolve?hostname=${encodeURIComponent(rawHostname)}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const data = response.data as StoreDomainResolutionResponse
                expect(data.resolved).toBe(true)
                expect(data.seller_id).toBe(fixture.sellerId)
                expect(data.channel_type).toBe("retail")
            })

            it("returns 400 Bad Request when hostname parameter is missing", async () => {
                const error = await api
                    .get("/store/domains/resolve", storeHeaders)
                    .catch((err: unknown) => {
                        const apiErr = err as ApiDomainErrorResponse
                        return apiErr.response
                    })

                expect(error).toBeDefined()
                expect(error?.status).toBe(400)
            })

            it("resolves via algorithmic subdomain fallback when handle matches active seller", async () => {
                const tag = `algo_${Date.now()}`
                const sellerSeed = await createSellerUser(appContainer, {
                    email: `algo_${tag}@test.com`,
                    name: `Algo Seller ${tag}`,
                })

                const knex = appContainer.resolve<KnexClient>(ContainerRegistrationKeys.PG_CONNECTION)
                const sellers = await knex("seller").where({ id: sellerSeed.seller.id }).select("handle")
                const handle = sellers[0]?.handle as string

                if (handle) {
                    // Test wholesale algorithmic resolution
                    const wsHostname = `${handle}.factorytribe.com`
                    const wsRes = await api.get(
                        `/store/domains/resolve?hostname=${wsHostname}`,
                        storeHeaders
                    )
                    expect(wsRes.status).toBe(200)
                    const wsData = wsRes.data as StoreDomainResolutionResponse
                    expect(wsData.resolved).toBe(true)
                    expect(wsData.seller_id).toBe(sellerSeed.seller.id)
                    expect(wsData.channel_type).toBe("wholesale")

                    // Test retail algorithmic resolution
                    const retHostname = `${handle}.threadbuy.com`
                    const retRes = await api.get(
                        `/store/domains/resolve?hostname=${retHostname}`,
                        storeHeaders
                    )
                    expect(retRes.status).toBe(200)
                    const retData = retRes.data as StoreDomainResolutionResponse
                    expect(retData.resolved).toBe(true)
                    expect(retData.seller_id).toBe(sellerSeed.seller.id)
                    expect(retData.channel_type).toBe("retail")
                }
            })
        })
    },
})
