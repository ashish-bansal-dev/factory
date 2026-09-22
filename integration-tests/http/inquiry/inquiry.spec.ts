import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../helpers/create-admin-user"
import { createSellerUser } from "../../helpers/create-seller-user"
import { assignProductsToSeller } from "../../helpers/create-product"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Wholesale Inquiries API", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let testProductId: string
      let testVariantId: string
      let testSellerId: string

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        const { seller } = await createSellerUser(appContainer, {
          email: "inquiry_brand@example.com",
          name: "Surat Textiles Co",
        })
        testSellerId = (seller as { id: string }).id

        const { result: products } = await createProductsWorkflow(appContainer).run({
          input: {
            products: [
              {
                title: "Pure Surat Silk Saree",
                status: "published",
                variants: [
                  {
                    title: "Royal Blue",
                  },
                ],
              },
            ],
            created_by: "admin_user",
          },
        })

        const product = (products as Array<{ id: string }>)[0]
        testProductId = product.id

        const query = appContainer.resolve(ContainerRegistrationKeys.QUERY)
        const { data: queriedProducts } = await query.graph({
          entity: "product",
          fields: ["id", "variants.id"],
          filters: { id: testProductId },
        })

        testVariantId = (queriedProducts[0].variants as Array<{ id: string }>)[0].id

        await assignProductsToSeller(appContainer, testSellerId, [testProductId])
      })

      describe("POST /store/inquiries", () => {
        it("creates a wholesale inquiry and returns whatsapp deep link for verified product and seller", async () => {
          const payload = {
            store_name: "Gujarat Silk Traders",
            contact_number: "9876543210",
            location: "Surat, Gujarat",
            product_id: testProductId,
            variant_id: testVariantId,
            seller_id: testSellerId,
            quantity: 50,
            notes: "Need fabric samples and wholesale pricing",
          }

          const response = await api.post("/store/inquiries", payload, storeHeaders)

          expect(response.status).toEqual(201)
          expect(response.data.inquiry).toBeDefined()
          expect(response.data.inquiry.store_name).toEqual(payload.store_name)
          expect(response.data.inquiry.contact_number).toEqual(payload.contact_number)
          expect(response.data.inquiry.location).toEqual(payload.location)
          expect(response.data.inquiry.product_id).toEqual(testProductId)
          expect(response.data.inquiry.variant_id).toEqual(testVariantId)
          expect(response.data.inquiry.seller_id).toEqual(testSellerId)
          expect(response.data.whatsapp_url).toContain("https://wa.me/")
          expect(response.data.whatsapp_url).toContain(encodeURIComponent(payload.store_name))
        })

        it("auto-resolves seller and product title when seller_id is omitted", async () => {
          const payload = {
            store_name: "Royal Boutique",
            contact_number: "9876543211",
            location: "Ahmedabad, Gujarat",
            product_id: testProductId,
            quantity: 20,
          }

          const response = await api.post("/store/inquiries", payload, storeHeaders)

          expect(response.status).toEqual(201)
          expect(response.data.inquiry.seller_id).toEqual(testSellerId)
          expect(response.data.inquiry.metadata.product_title).toEqual("Pure Surat Silk Saree")
        })

        it("rejects inquiry with non-existent product_id", async () => {
          const payload = {
            store_name: "Fake Store",
            contact_number: "9876543210",
            location: "Surat, Gujarat",
            product_id: "prod_does_not_exist_404",
          }

          const response = await api
            .post("/store/inquiries", payload, storeHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })

        it("rejects inquiry when seller_id does not match product owner", async () => {
          const { seller: otherSeller } = await createSellerUser(appContainer, {
            email: "other_seller@example.com",
            name: "Other Brand",
          })

          const payload = {
            store_name: "Mismatch Store",
            contact_number: "9876543210",
            location: "Surat, Gujarat",
            product_id: testProductId,
            seller_id: (otherSeller as { id: string }).id,
          }

          const response = await api
            .post("/store/inquiries", payload, storeHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain("does not belong to seller")
        })

        it("rejects inquiry when variant_id does not belong to product", async () => {
          const payload = {
            store_name: "Mismatch Variant Store",
            contact_number: "9876543210",
            location: "Surat, Gujarat",
            product_id: testProductId,
            variant_id: "variant_does_not_belong",
          }

          const response = await api
            .post("/store/inquiries", payload, storeHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
          expect(response.data.message).toContain("does not belong to product")
        })

        it("validates required fields", async () => {
          const invalidPayload = {
            store_name: "",
            contact_number: "123",
          }

          const response = await api
            .post("/store/inquiries", invalidPayload, storeHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("GET /store/inquiries", () => {
        it("rejects public inquiries listing to protect PII", async () => {
          const response = await api
            .get("/store/inquiries", storeHeaders)
            .catch((e: any) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("GET /admin/inquiries", () => {
        it("allows admin to retrieve wholesale inquiries", async () => {
          const response = await api.get("/admin/inquiries", adminHeaders)

          expect(response.status).toEqual(200)
          expect(Array.isArray(response.data.inquiries)).toBe(true)
          expect(typeof response.data.count).toEqual("number")
        })
      })

      describe("GET /vendor/inquiries", () => {
        it("allows seller to retrieve vendor-scoped wholesale inquiries", async () => {
          const { headers: sellerHeaders } = await createSellerUser(appContainer, {
            email: "seller_inq@medusa.js",
            name: "Inquiry Test Seller",
          })

          const response = await api.get("/vendor/inquiries", sellerHeaders)

          expect(response.status).toEqual(200)
          expect(Array.isArray(response.data.inquiries)).toBe(true)
          expect(typeof response.data.count).toEqual("number")
        })
      })
    })
  },
})
