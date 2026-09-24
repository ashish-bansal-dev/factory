import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
    IRegionModuleService,
    ISalesChannelModuleService,
    MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"
import { createShippingProfile } from "../../../helpers/create-shipping-profile"
import {
    assignProductsToSeller,
    createVendorProduct,
} from "../../../helpers/create-product"
import {
    generatePublishableKey,
    generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { approveSeller } from "../../../helpers/split-order-checkout"

interface VariantPriceCalculation {
    calculated_amount?: number
    currency_code?: string
    [key: string]: unknown
}

interface PackPricePayload {
    amount: number
    currency_code?: string
    unit_amount?: number
    bundle_size?: number
}

interface ProductVariantResponse {
    id: string
    title?: string
    sku?: string
    offer_id?: string | null
    offer_type?: "retail" | "wholesale" | null
    bundle_size?: number | null
    mrp?: number | string | null
    pack_price?: PackPricePayload | null
    calculated_price?: {
        calculated_amount?: number
        calculated_price?: VariantPriceCalculation
        [key: string]: unknown
    } | null
    [key: string]: unknown
}

interface StoreProductResponse {
    id: string
    title: string
    variants: ProductVariantResponse[]
    [key: string]: unknown
}

interface StoreOfferResponse {
    id: string
    offer_type: "retail" | "wholesale"
    bundle_size: number
    variant_id: string
    prices: { amount: number; currency_code: string }[]
    [key: string]: unknown
}

interface StoreHeadersWrapper {
    headers: {
        "x-publishable-api-key": string
        [key: string]: string
    }
}

jest.setTimeout(90000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Channel Scoping & Pack Pricing (/store/products & /store/offers)", () => {
            let appContainer: MedusaContainer
            let storeHeaders: StoreHeadersWrapper
            let salesChannel: { id: string; name: string }
            let region: { id: string; name: string; currency_code: string }

            let seedCounter = 0
            const setupDualChannelProduct = async () => {
                const idx = ++seedCounter
                const tag = `csp_${idx}_${Date.now()}`

                const sellerSeed = await createSellerUser(appContainer, {
                    email: `seller_${tag}@test.com`,
                    name: `Seller ${tag}`,
                })
                await approveSeller(appContainer, sellerSeed.seller.id)

                const stockLocationRes = await api.post(
                    "/vendor/stock-locations",
                    { name: `WH ${tag}` },
                    sellerSeed.headers
                )
                const stockLocation = (stockLocationRes.data as { stock_location: { id: string } }).stock_location

                await api.post(
                    `/vendor/stock-locations/${stockLocation.id}/sales-channels`,
                    { add: [salesChannel.id] },
                    sellerSeed.headers
                )

                const product = await createVendorProduct(api, sellerSeed.headers, {
                    title: `Dual Offer Product ${tag}`,
                    sku: `SKU-CSP-${tag}`,
                })

                await assignProductsToSeller(appContainer, sellerSeed.seller.id, [product.id])

                await api.post(
                    `/vendor/sales-channels/${salesChannel.id}/products`,
                    { add: [product.id] },
                    sellerSeed.headers
                )

                const shippingProfile = await createShippingProfile(appContainer, {
                    name: `Ship ${tag}`,
                })

                const variantId = product.variants[0].id
                const sharedSku = `SHARED-OFFER-${tag}`

                // 1. Retail offer: unit price $25.00 (2500), bundle_size = 1, mrp = 3500
                const retailOfferRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: variantId,
                        shipping_profile_id: shippingProfile.id,
                        offer_type: "retail",
                        bundle_size: 1,
                        mrp: 3500,
                        inventory_items: [
                            {
                                title: `Retail Inv ${tag}`,
                                required_quantity: 1,
                                stock_levels: [
                                    { location_id: stockLocation.id, stocked_quantity: 100 },
                                ],
                            },
                        ],
                        prices: [{ amount: 2500, currency_code: "usd" }],
                    },
                    sellerSeed.headers
                )
                const retailOffer = (retailOfferRes.data as { offer: StoreOfferResponse }).offer

                // 2. Wholesale offer: unit price $18.00 (1800), bundle_size = 6, mrp = 3500
                // Pack price expected: 1800 * 6 = 10800 ($108.00)
                const wholesaleOfferRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: sharedSku,
                        variant_id: variantId,
                        shipping_profile_id: shippingProfile.id,
                        offer_type: "wholesale",
                        bundle_size: 6,
                        mrp: 3500,
                        inventory_items: [
                            {
                                title: `Wholesale Inv ${tag}`,
                                required_quantity: 1,
                                stock_levels: [
                                    { location_id: stockLocation.id, stocked_quantity: 100 },
                                ],
                            },
                        ],
                        prices: [{ amount: 1800, currency_code: "usd" }],
                    },
                    sellerSeed.headers
                )
                const wholesaleOffer = (wholesaleOfferRes.data as { offer: StoreOfferResponse }).offer

                return {
                    seller: sellerSeed.seller,
                    product,
                    variantId,
                    retailOffer,
                    wholesaleOffer,
                }
            }

            beforeAll(() => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(
                    Modules.SALES_CHANNEL
                )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Dual Channel Store",
                })

                const regionModule = appContainer.resolve<IRegionModuleService>(
                    Modules.REGION
                )
                region = await regionModule.createRegions({
                    name: "Test Region",
                    currency_code: "usd",
                    countries: ["us"],
                })

                const link = appContainer.resolve<{
                    create: (data: Record<string, unknown>) => Promise<unknown>
                }>(ContainerRegistrationKeys.LINK)

                await link.create({
                    [Modules.REGION]: { region_id: region.id },
                    [Modules.PAYMENT]: {
                        payment_provider_id: "pp_system_default",
                    },
                })

                const apiKey = await generatePublishableKey(appContainer)
                storeHeaders = generateStoreHeaders({ publishableKey: apiKey }) as StoreHeadersWrapper
            })

            it("returns only retail offer and retail unit price when x-channel: retail is passed", async () => {
                const fixture = await setupDualChannelProduct()

                const reqHeaders = {
                    ...storeHeaders,
                    headers: {
                        ...storeHeaders.headers,
                        "x-channel": "retail",
                    },
                }

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    reqHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                expect(products.length).toBeGreaterThanOrEqual(1)

                const targetProduct = products.find((p) => p.id === fixture.product.id)
                expect(targetProduct).toBeDefined()

                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)
                expect(variant).toBeDefined()
                expect(variant?.offer_id).toBe(fixture.retailOffer.id)
                expect(variant?.offer_type).toBe("retail")
                expect(Number(variant?.bundle_size ?? 1)).toBe(1)

                const priceAmount =
                    variant?.calculated_price?.calculated_amount ??
                    variant?.calculated_price?.calculated_price?.calculated_amount
                expect(priceAmount).toBe(2500)
            })

            it("returns wholesale offer, bundle_size, and calculated pack price when x-channel: wholesale is passed", async () => {
                const fixture = await setupDualChannelProduct()

                const reqHeaders = {
                    ...storeHeaders,
                    headers: {
                        ...storeHeaders.headers,
                        "x-channel": "wholesale",
                    },
                }

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    reqHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                const targetProduct = products.find((p) => p.id === fixture.product.id)
                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)

                expect(variant).toBeDefined()
                expect(variant?.offer_id).toBe(fixture.wholesaleOffer.id)
                expect(variant?.offer_type).toBe("wholesale")
                expect(Number(variant?.bundle_size)).toBe(6)

                // Pack price calculation: unit price (1800) * bundle_size (6) = 10800
                const packAmount =
                    variant?.pack_price?.amount ??
                    (variant?.calculated_price?.calculated_price as { pack_price?: number } | undefined)?.pack_price
                expect(packAmount).toBe(10800)
            })

            it("supports query parameter fallback channel=wholesale when x-channel header is omitted", async () => {
                const fixture = await setupDualChannelProduct()

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&channel=wholesale&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                const targetProduct = products.find((p) => p.id === fixture.product.id)
                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)

                expect(variant?.offer_id).toBe(fixture.wholesaleOffer.id)
                expect(variant?.offer_type).toBe("wholesale")
                expect(Number(variant?.bundle_size)).toBe(6)

                const packAmount =
                    variant?.pack_price?.amount ??
                    (variant?.calculated_price?.calculated_price as { pack_price?: number } | undefined)?.pack_price
                expect(packAmount).toBe(10800)
            })

            it("supports query parameter fallback channel=retail when x-channel header is omitted", async () => {
                const fixture = await setupDualChannelProduct()

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&channel=retail&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    storeHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                const targetProduct = products.find((p) => p.id === fixture.product.id)
                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)

                expect(variant?.offer_id).toBe(fixture.retailOffer.id)
                expect(variant?.offer_type).toBe("retail")
            })

            it("gives x-channel header precedence over query parameter", async () => {
                const fixture = await setupDualChannelProduct()

                // Header specifies wholesale, query param specifies retail
                const reqHeaders = {
                    ...storeHeaders,
                    headers: {
                        ...storeHeaders.headers,
                        "x-channel": "wholesale",
                    },
                }

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&channel=retail&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    reqHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                const targetProduct = products.find((p) => p.id === fixture.product.id)
                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)

                // Header wins: wholesale offer should be selected
                expect(variant?.offer_id).toBe(fixture.wholesaleOffer.id)
                expect(variant?.offer_type).toBe("wholesale")
            })

            it("handles case-insensitive x-channel header values (e.g. WHOLESALE)", async () => {
                const fixture = await setupDualChannelProduct()

                const reqHeaders = {
                    ...storeHeaders,
                    headers: {
                        ...storeHeaders.headers,
                        "x-channel": "WHOLESALE",
                    },
                }

                const response = await api.get(
                    `/store/products?id=${fixture.product.id}&fields=*variants,+variants.calculated_price&region_id=${region.id}`,
                    reqHeaders
                )

                expect(response.status).toBe(200)
                const products = (response.data as { products: StoreProductResponse[] }).products
                const targetProduct = products.find((p) => p.id === fixture.product.id)
                const variant = targetProduct?.variants.find((v) => v.id === fixture.variantId)

                expect(variant?.offer_id).toBe(fixture.wholesaleOffer.id)
                expect(variant?.offer_type).toBe("wholesale")
            })

            it("filters /store/offers by channel correctly", async () => {
                const fixture = await setupDualChannelProduct()

                // Query retail offers
                const retailRes = await api.get(
                    `/store/offers?product_id=${fixture.product.id}&channel=retail`,
                    storeHeaders
                )
                expect(retailRes.status).toBe(200)
                const retailOffers = (retailRes.data as { offers: StoreOfferResponse[] }).offers
                expect(retailOffers.every((o) => o.offer_type === "retail")).toBe(true)
                expect(retailOffers.some((o) => o.id === fixture.retailOffer.id)).toBe(true)

                // Query wholesale offers
                const wholesaleRes = await api.get(
                    `/store/offers?product_id=${fixture.product.id}&channel=wholesale`,
                    storeHeaders
                )
                expect(wholesaleRes.status).toBe(200)
                const wholesaleOffers = (wholesaleRes.data as { offers: StoreOfferResponse[] }).offers
                expect(wholesaleOffers.every((o) => o.offer_type === "wholesale")).toBe(true)
                expect(wholesaleOffers.some((o) => o.id === fixture.wholesaleOffer.id)).toBe(true)
            })
        })
    },
})
