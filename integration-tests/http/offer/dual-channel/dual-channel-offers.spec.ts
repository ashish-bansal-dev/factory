import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import { createVendorProduct } from "../../../helpers/create-product"

interface OfferApiResponse {
    id: string
    sku: string
    variant_id: string
    product_id: string
    seller_id: string
    offer_type: "retail" | "wholesale"
    bundle_size: number
    mrp: number | string | null
    lead_time_days: number | null
    prices: { amount: number; currency_code: string }[]
    inventory_items: { id: string; required_quantity: number }[]
}

interface ApiErrorResponse {
    response?: {
        status: number
        data?: {
            message?: string
            type?: string
        }
    }
}

jest.setTimeout(60000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Dual-Channel Offers (/vendor/offers)", () => {
            let appContainer: MedusaContainer

            let seedCounter = 0
            const setupVendorWithProduct = async (sellerType?: string | null) => {
                const idx = ++seedCounter
                const tag = `dc_${idx}_${Date.now()}`
                const email = `seller_${tag}@test.com`
                const name = `Seller ${tag}`

                const sellerSeed = await createSellerUser(appContainer, {
                    email,
                    name,
                })

                if (sellerType !== undefined) {
                    const knex = appContainer.resolve<{
                        (table: string): {
                            where: (clause: Record<string, unknown>) => {
                                update: (data: Record<string, unknown>) => Promise<unknown>
                            }
                        }
                    }>(ContainerRegistrationKeys.PG_CONNECTION)

                    await knex("seller")
                        .where({ id: sellerSeed.seller.id })
                        .update({ type: sellerType })
                }

                const product = await createVendorProduct(api, sellerSeed.headers, {
                    title: `Dual Channel Product ${tag}`,
                    sku: `SKU-VAR-${tag}`,
                })

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `Shipping ${tag}`,
                })

                return {
                    sellerId: sellerSeed.seller.id,
                    headers: sellerSeed.headers,
                    product,
                    variantId: product.variants[0].id,
                    shippingProfileId: shippingProfile.id,
                    tag,
                }
            }

            beforeAll(() => {
                appContainer = getContainer()
            })

            it("allows manufacturer to create retail offer (single-unit) on a variant", async () => {
                const fixture = await setupVendorWithProduct("manufacturer")
                const sku = `MFR-RETAIL-${fixture.tag}`

                const response = await api.post(
                    "/vendor/offers",
                    {
                        sku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "retail",
                        bundle_size: 1,
                        mrp: 3000,
                        lead_time_days: 2,
                        inventory_items: [{ required_quantity: 1 }],
                        prices: [{ amount: 2000, currency_code: "usd" }],
                    },
                    fixture.headers
                )

                const data = response.data as { offer: OfferApiResponse }
                expect(response.status).toBe(201)
                expect(data.offer).toBeDefined()
                expect(data.offer.sku).toBe(sku)
                expect(data.offer.offer_type).toBe("retail")
                expect(Number(data.offer.bundle_size)).toBe(1)
                expect(data.offer.variant_id).toBe(fixture.variantId)
            })

            it("allows manufacturer to create wholesale offer (bundle_size >= 1) on the same variant with the same SKU without unique index collision", async () => {
                const fixture = await setupVendorWithProduct("manufacturer")
                const sharedSku = `SHARED-SKU-${fixture.tag}`

                // 1. Create retail offer
                const retailRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "retail",
                        bundle_size: 1,
                        prices: [{ amount: 2500, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                const retailData = retailRes.data as { offer: OfferApiResponse }
                expect(retailRes.status).toBe(201)
                expect(retailData.offer.sku).toBe(sharedSku)
                expect(retailData.offer.offer_type).toBe("retail")

                // 2. Create wholesale offer with the EXACT SAME SKU and variant_id
                const wholesaleRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "wholesale",
                        bundle_size: 6,
                        mrp: 3500,
                        lead_time_days: 5,
                        prices: [{ amount: 1500, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )

                const wholesaleData = wholesaleRes.data as { offer: OfferApiResponse }
                expect(wholesaleRes.status).toBe(201)
                expect(wholesaleData.offer.sku).toBe(sharedSku)
                expect(wholesaleData.offer.offer_type).toBe("wholesale")
                expect(Number(wholesaleData.offer.bundle_size)).toBe(6)
                expect(wholesaleData.offer.id).not.toBe(retailData.offer.id)
            })

            it("allows wholesaler to create both retail and wholesale offers", async () => {
                const fixture = await setupVendorWithProduct("wholesaler")
                const sharedSku = `WS-SKU-${fixture.tag}`

                const retailRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "retail",
                        bundle_size: 1,
                        prices: [{ amount: 3000, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                expect(retailRes.status).toBe(201)

                const wholesaleRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "wholesale",
                        bundle_size: 12,
                        prices: [{ amount: 1800, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                const wholesaleData = wholesaleRes.data as { offer: OfferApiResponse }
                expect(wholesaleRes.status).toBe(201)
                expect(Number(wholesaleData.offer.bundle_size)).toBe(12)
            })

            it("allows retailer (seller.type = 'retailer') to successfully create retail offer", async () => {
                const fixture = await setupVendorWithProduct("retailer")
                const sku = `RET-OFFER-${fixture.tag}`

                const response = await api.post(
                    "/vendor/offers",
                    {
                        sku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "retail",
                        bundle_size: 1,
                        prices: [{ amount: 4000, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )

                const data = response.data as { offer: OfferApiResponse }
                expect(response.status).toBe(201)
                expect(data.offer.offer_type).toBe("retail")
                expect(data.offer.sku).toBe(sku)
            })

            it("rejects retailer (seller.type = 'retailer') attempting to create wholesale offer", async () => {
                const fixture = await setupVendorWithProduct("retailer")
                const sku = `RET-WHOLESALE-REJECT-${fixture.tag}`

                const error = await api
                    .post(
                        "/vendor/offers",
                        {
                            sku,
                            variant_id: fixture.variantId,
                            shipping_profile_id: fixture.shippingProfileId,
                            offer_type: "wholesale",
                            bundle_size: 6,
                            prices: [{ amount: 1200, currency_code: "usd" }],
                            inventory_items: [{ required_quantity: 1 }],
                        },
                        fixture.headers
                    )
                    .catch((err: unknown) => {
                        const apiErr = err as ApiErrorResponse
                        return apiErr.response
                    })

                expect(error).toBeDefined()
                expect(error?.status).toBe(400)
                expect(error?.data?.message).toMatch(/retailer/i)
            })

            it("allows untyped / legacy seller (seller.type = null) to create both retail and wholesale offers", async () => {
                const fixture = await setupVendorWithProduct(null)
                const sharedSku = `LEGACY-SKU-${fixture.tag}`

                const retailRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "retail",
                        bundle_size: 1,
                        prices: [{ amount: 2200, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                expect(retailRes.status).toBe(201)

                const wholesaleRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "wholesale",
                        bundle_size: 4,
                        prices: [{ amount: 1600, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                const wholesaleData = wholesaleRes.data as { offer: OfferApiResponse }
                expect(wholesaleRes.status).toBe(201)
                expect(wholesaleData.offer.offer_type).toBe("wholesale")
            })

            it("enforces uniqueness on (seller_id, sku, offer_type) composite index", async () => {
                const fixture = await setupVendorWithProduct("manufacturer")
                const sku = `DUP-SKU-${fixture.tag}`

                const first = await api.post(
                    "/vendor/offers",
                    {
                        sku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        offer_type: "wholesale",
                        bundle_size: 6,
                        prices: [{ amount: 1500, currency_code: "usd" }],
                        inventory_items: [{ required_quantity: 1 }],
                    },
                    fixture.headers
                )
                expect(first.status).toBe(201)

                // Attempt to create second offer with same seller, same sku, same offer_type
                const secondError = await api
                    .post(
                        "/vendor/offers",
                        {
                            sku,
                            variant_id: fixture.variantId,
                            shipping_profile_id: fixture.shippingProfileId,
                            offer_type: "wholesale",
                            bundle_size: 12,
                            prices: [{ amount: 1400, currency_code: "usd" }],
                            inventory_items: [{ required_quantity: 1 }],
                        },
                        fixture.headers
                    )
                    .catch((err: unknown) => {
                        const apiErr = err as ApiErrorResponse
                        return apiErr.response
                    })

                expect(secondError).toBeDefined()
                expect(secondError?.status).toBeGreaterThanOrEqual(400)
            })

            it("defaults offer_type to 'retail' and bundle_size to 1 when omitted", async () => {
                const fixture = await setupVendorWithProduct("manufacturer")
                const sku = `DEFAULT-OFFER-${fixture.tag}`

                const response = await api.post(
                    "/vendor/offers",
                    {
                        sku,
                        variant_id: fixture.variantId,
                        shipping_profile_id: fixture.shippingProfileId,
                        inventory_items: [{ required_quantity: 1 }],
                        prices: [{ amount: 1999, currency_code: "usd" }],
                    },
                    fixture.headers
                )

                const data = response.data as { offer: OfferApiResponse }
                expect(response.status).toBe(201)
                expect(data.offer.offer_type).toBe("retail")
                expect(Number(data.offer.bundle_size)).toBe(1)
            })
        })
    },
})
