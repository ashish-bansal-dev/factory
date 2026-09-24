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

interface CartLineItem {
    id: string
    quantity: number
    unit_price: number
    title?: string
    variant_id?: string
    [key: string]: unknown
}

interface CartResponse {
    id: string
    items: CartLineItem[]
    region_id: string
    currency_code: string
    [key: string]: unknown
}

interface ApiCartErrorResponse {
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

jest.setTimeout(90000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Wholesale Cart Line-Item Validation (/store/carts/:id/line-items)", () => {
            let appContainer: MedusaContainer
            let storeHeaders: StoreHeadersWrapper
            let salesChannel: { id: string; name: string }
            let region: { id: string; name: string; currency_code: string }

            let seedCounter = 0
            const setupOfferFixture = async (opts: {
                offerType: "retail" | "wholesale"
                bundleSize: number
                price: number
                stocked: number
            }) => {
                const idx = ++seedCounter
                const tag = `wcv_${idx}_${Date.now()}`

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
                    title: `Test Product ${tag}`,
                    sku: `SKU-WCV-${tag}`,
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

                const offerRes = await api.post(
                    "/vendor/offers",
                    {
                        sku: `OFFER-${tag}`,
                        variant_id: product.variants[0].id,
                        shipping_profile_id: shippingProfile.id,
                        offer_type: opts.offerType,
                        bundle_size: opts.bundleSize,
                        inventory_items: [
                            {
                                title: `Inv ${tag}`,
                                required_quantity: 1,
                                stock_levels: [
                                    { location_id: stockLocation.id, stocked_quantity: opts.stocked },
                                ],
                            },
                        ],
                        prices: [{ amount: opts.price, currency_code: "usd" }],
                    },
                    sellerSeed.headers
                )

                const offer = (offerRes.data as { offer: { id: string } }).offer

                return {
                    seller: sellerSeed.seller,
                    product,
                    offer,
                }
            }

            const createCart = async (): Promise<CartResponse> => {
                const res = await api.post(
                    "/store/carts",
                    {
                        region_id: region.id,
                        sales_channel_id: salesChannel.id,
                        currency_code: "usd",
                    },
                    storeHeaders
                )
                return (res.data as { cart: CartResponse }).cart
            }

            beforeAll(() => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const salesChannelModule = appContainer.resolve<ISalesChannelModuleService>(
                    Modules.SALES_CHANNEL
                )
                salesChannel = await salesChannelModule.createSalesChannels({
                    name: "Wholesale Cart Store",
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

            it("successfully adds line item to wholesale cart when quantity is a multiple of bundle_size", async () => {
                // Wholesale offer with bundle_size: 6
                const fixture = await setupOfferFixture({
                    offerType: "wholesale",
                    bundleSize: 6,
                    price: 1500,
                    stocked: 100,
                })

                const cart = await createCart()

                // Add 1 pack (quantity 6)
                const addRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 6,
                    },
                    storeHeaders
                )

                expect(addRes.status).toBe(200)
                const updatedCart = (addRes.data as { cart: CartResponse }).cart
                expect(updatedCart.items).toHaveLength(1)
                expect(updatedCart.items[0].quantity).toBe(6)

                // Add another 2 packs (quantity 12) to existing line item
                const addMoreRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 12,
                    },
                    storeHeaders
                )

                expect(addMoreRes.status).toBe(200)
                const cartAfterSecondAdd = (addMoreRes.data as { cart: CartResponse }).cart
                const item = cartAfterSecondAdd.items.find((i) => i.id === updatedCart.items[0].id)
                expect(item?.quantity).toBe(18)
            })

            it("rejects line item addition when quantity is NOT a multiple of bundle_size", async () => {
                // Wholesale offer with bundle_size: 6
                const fixture = await setupOfferFixture({
                    offerType: "wholesale",
                    bundleSize: 6,
                    price: 1500,
                    stocked: 100,
                })

                const cart = await createCart()

                const nonMultiples = [1, 5, 7]
                const results = await Promise.all(
                    nonMultiples.map((invalidQuantity) =>
                        api
                            .post(
                                `/store/carts/${cart.id}/line-items`,
                                {
                                    offer_id: fixture.offer.id,
                                    quantity: invalidQuantity,
                                },
                                storeHeaders
                            )
                            .catch((err: unknown) => {
                                const apiErr = err as ApiCartErrorResponse
                                return apiErr.response
                            })
                    )
                )

                for (const error of results) {
                    expect(error).toBeDefined()
                    expect(error?.status).toBe(400)
                    expect(error?.data?.message).toMatch(/pack size|bundle_size|multiple/i)
                }
            })

            it("allows line item quantity update when new quantity is a multiple of bundle_size", async () => {
                const fixture = await setupOfferFixture({
                    offerType: "wholesale",
                    bundleSize: 6,
                    price: 1200,
                    stocked: 100,
                })

                const cart = await createCart()

                const addRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 6,
                    },
                    storeHeaders
                )

                const lineId = (addRes.data as { cart: CartResponse }).cart.items[0].id

                // Update to 18 (18 % 6 === 0)
                const updateRes = await api.post(
                    `/store/carts/${cart.id}/line-items/${lineId}`,
                    { quantity: 18 },
                    storeHeaders
                )

                expect(updateRes.status).toBe(200)
                const updatedLine = (updateRes.data as { cart: CartResponse }).cart.items.find(
                    (i) => i.id === lineId
                )
                expect(updatedLine?.quantity).toBe(18)
            })

            it("rejects line item quantity update when new quantity is NOT a multiple of bundle_size", async () => {
                const fixture = await setupOfferFixture({
                    offerType: "wholesale",
                    bundleSize: 6,
                    price: 1200,
                    stocked: 100,
                })

                const cart = await createCart()

                const addRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 6,
                    },
                    storeHeaders
                )

                const lineId = (addRes.data as { cart: CartResponse }).cart.items[0].id

                // Attempt update to 10 (10 % 6 !== 0)
                const updateError = await api
                    .post(
                        `/store/carts/${cart.id}/line-items/${lineId}`,
                        { quantity: 10 },
                        storeHeaders
                    )
                    .catch((err: unknown) => {
                        const apiErr = err as ApiCartErrorResponse
                        return apiErr.response
                    })

                expect(updateError).toBeDefined()
                expect(updateError?.status).toBe(400)
                expect(updateError?.data?.message).toMatch(/pack size|bundle_size|multiple/i)
            })

            it("allows retail offers with bundle_size = 1 to add any valid quantity without divisibility restriction", async () => {
                const fixture = await setupOfferFixture({
                    offerType: "retail",
                    bundleSize: 1,
                    price: 3000,
                    stocked: 50,
                })

                const cart = await createCart()

                // Adding odd and non-pack quantities (1, 3, 5) should all succeed
                const addRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 3,
                    },
                    storeHeaders
                )

                expect(addRes.status).toBe(200)
                const items = (addRes.data as { cart: CartResponse }).cart.items
                expect(items[0].quantity).toBe(3)
            })

            it("allows wholesale offers with bundle_size = 1 to add any positive integer quantity", async () => {
                const fixture = await setupOfferFixture({
                    offerType: "wholesale",
                    bundleSize: 1,
                    price: 2000,
                    stocked: 50,
                })

                const cart = await createCart()

                const addRes = await api.post(
                    `/store/carts/${cart.id}/line-items`,
                    {
                        offer_id: fixture.offer.id,
                        quantity: 5,
                    },
                    storeHeaders
                )

                expect(addRes.status).toBe(200)
                const items = (addRes.data as { cart: CartResponse }).cart.items
                expect(items[0].quantity).toBe(5)
            })
        })
    },
})
