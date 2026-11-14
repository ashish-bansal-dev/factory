import { describe, expect, it, mock } from "bun:test"
import { ContainerRegistrationKeys, MedusaError, Modules, OrderStatus } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

// Mock createOrderWorkflow from @medusajs/core-flows
let mockWorkflowRunInput: any = null
const mockDraftOrderId = "order_draft_test_123"

const mockWorkflow = {
  run: async ({ input }: { input: any }) => {
    mockWorkflowRunInput = input
    return {
      result: {
        id: mockDraftOrderId,
        status: input.status,
        is_draft_order: input.is_draft_order,
        items: input.items,
        currency_code: input.currency_code,
        metadata: input.metadata,
      },
    }
  },
}

mock.module("@medusajs/core-flows", () => ({
  createOrderWorkflow: () => mockWorkflow,
}))

import { POST } from "../route"
import { VendorCreateDraftOrderFromInquiry } from "../../../validators"

describe("Vendor Inquiry Create Draft Order Route (POST /vendor/inquiries/:id/create-draft-order)", () => {
  const sellerId = "sel_active_vendor"
  const otherSellerId = "sel_rival_vendor"
  const inquiryId = "inq_test_789"

  const createMockReq = ({
    params = { id: inquiryId },
    sellerContext = { seller_id: sellerId },
    body = {
      items: [
        {
          variant_id: "var_pack_6",
          quantity: 10,
          unit_price: 45,
        },
      ],
      currency_code: "usd",
      shipping_amount: 50,
      notes: "Negotiated 10% wholesale volume discount",
    },
    inquiryRecord = {
      id: inquiryId,
      store_name: "Boutique Paris",
      contact_number: "+15551234567",
      seller_id: sellerId,
      product_id: "prod_dress",
      variant_id: "var_pack_6",
      status: "new",
      metadata: { email: "buyer@boutique.com" },
    } as any,
  }: {
    params?: Record<string, string>
    sellerContext?: { seller_id?: string } | null
    body?: Record<string, unknown>
    inquiryRecord?: any
  }) => {
    let createdLinks: any[] = []
    let updatedInquiryPayload: any = null

    const mockQuery = {
      graph: async ({ entity, filters }: { entity: string; filters: Record<string, unknown> }) => {
        if (entity === "product_variant") {
          return {
            data: [
              {
                id: "var_pack_6",
                title: "Prepack Size Curve 6",
                sku: "CURVE-6",
                product: { title: "Silk Dress" },
              },
            ],
          }
        }
        if (entity === "region") {
          return {
            data: [{ id: "reg_default", currency_code: "usd" }],
          }
        }
        if (entity === "shipping_option") {
          return {
            data: [{ id: "so_freight_1", name: "Standard Freight", seller_id: sellerId }],
          }
        }
        if (entity === "order") {
          return {
            data: [
              {
                id: mockDraftOrderId,
                status: OrderStatus.DRAFT,
                is_draft_order: true,
                currency_code: "usd",
                total: 500,
                subtotal: 450,
                items: [
                  {
                    id: "item_1",
                    variant_id: "var_pack_6",
                    quantity: 10,
                    unit_price: 45,
                  },
                ],
                shipping_methods: [{ id: "sm_1", amount: 50 }],
                metadata: mockWorkflowRunInput?.metadata,
              },
            ],
          }
        }
        return { data: [] }
      },
    }

    const mockRemoteLink = {
      create: async (links: any[]) => {
        createdLinks.push(...links)
      },
    }

    const mockInquiryService = {
      retrieveWholesaleInquiry: async (id: string) => {
        if (!inquiryRecord || inquiryRecord.id !== id) {
          throw new Error("Not found")
        }
        return inquiryRecord
      },
      updateWholesaleInquiries: async (payload: any) => {
        updatedInquiryPayload = payload
        return {
          ...inquiryRecord,
          ...payload,
        }
      },
    }

    const req: any = {
      params,
      seller_context: sellerContext,
      validatedBody: body,
      scope: {
        resolve: (key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) return mockQuery
          if (key === ContainerRegistrationKeys.LINK) return mockRemoteLink
          if (key === MercurModules.INQUIRY) return mockInquiryService
          throw new Error(`Unknown registration key: ${key}`)
        },
      },
    }

    let status = 200
    let jsonBody: any = null
    const res: any = {
      status: (code: number) => {
        status = code
        return res
      },
      json: (data: any) => {
        jsonBody = data
        return res
      },
    }

    return {
      req,
      res,
      getStatus: () => status,
      getJson: () => jsonBody,
      getCreatedLinks: () => createdLinks,
      getUpdatedInquiryPayload: () => updatedInquiryPayload,
    }
  }

  describe("Validation Schema (VendorCreateDraftOrderFromInquiry)", () => {
    it("validates a complete draft order conversion request", () => {
      const validPayload = {
        items: [
          {
            variant_id: "var_pack_1",
            quantity: 5,
            unit_price: 60,
          },
        ],
        currency_code: "usd",
        shipping_amount: 25,
        notes: "Fast delivery requested",
        email: "retailer@store.com",
      }

      const parsed = VendorCreateDraftOrderFromInquiry.parse(validPayload)
      expect(parsed.items.length).toBe(1)
      expect(parsed.items[0].variant_id).toBe("var_pack_1")
      expect(parsed.items[0].quantity).toBe(5)
      expect(parsed.items[0].unit_price).toBe(60)
      expect(parsed.shipping_amount).toBe(25)
      expect(parsed.notes).toBe("Fast delivery requested")
    })

    it("rejects empty items array", () => {
      expect(() => {
        VendorCreateDraftOrderFromInquiry.parse({
          items: [],
        })
      }).toThrow()
    })

    it("rejects invalid quantity (zero or negative)", () => {
      expect(() => {
        VendorCreateDraftOrderFromInquiry.parse({
          items: [{ variant_id: "var_1", quantity: 0, unit_price: 10 }],
        })
      }).toThrow()

      expect(() => {
        VendorCreateDraftOrderFromInquiry.parse({
          items: [{ variant_id: "var_1", quantity: -2, unit_price: 10 }],
        })
      }).toThrow()
    })

    it("rejects negative unit_price", () => {
      expect(() => {
        VendorCreateDraftOrderFromInquiry.parse({
          items: [{ variant_id: "var_1", quantity: 1, unit_price: -10 }],
        })
      }).toThrow()
    })
  })

  describe("POST Route Handler", () => {
    it("throws 401 UNAUTHORIZED if seller context is missing", async () => {
      const { req, res } = createMockReq({
        sellerContext: null,
      })

      let caughtError: any = null
      try {
        await POST(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.UNAUTHORIZED)
    })

    it("throws 404 NOT_FOUND if inquiry record does not exist", async () => {
      const { req, res } = createMockReq({
        inquiryRecord: null,
      })

      let caughtError: any = null
      try {
        await POST(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.NOT_FOUND)
    })

    it("throws 400 NOT_ALLOWED if inquiry belongs to a different seller", async () => {
      const { req, res } = createMockReq({
        inquiryRecord: {
          id: inquiryId,
          seller_id: otherSellerId,
          status: "new",
        },
      })

      let caughtError: any = null
      try {
        await POST(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.NOT_ALLOWED)
      expect(caughtError.message).toContain("does not own this inquiry")
    })

    it("successfully creates a draft order, links it to seller, and converts inquiry", async () => {
      const {
        req,
        res,
        getStatus,
        getJson,
        getCreatedLinks,
        getUpdatedInquiryPayload,
      } = createMockReq({})

      await POST(req, res)

      expect(getStatus()).toBe(200)

      // Verify createOrderWorkflow was called with draft order parameters
      expect(mockWorkflowRunInput).toBeDefined()
      expect(mockWorkflowRunInput.is_draft_order).toBe(true)
      expect(mockWorkflowRunInput.status).toBe(OrderStatus.DRAFT)
      expect(mockWorkflowRunInput.currency_code).toBe("usd")
      expect(mockWorkflowRunInput.email).toBe("buyer@boutique.com")
      expect(mockWorkflowRunInput.metadata.inquiry_id).toBe(inquiryId)
      expect(mockWorkflowRunInput.metadata.seller_id).toBe(sellerId)
      expect(mockWorkflowRunInput.metadata.notes).toBe("Negotiated 10% wholesale volume discount")
      expect(mockWorkflowRunInput.metadata.shipping_amount).toBe(50)

      // Verify items were passed with negotiated prices
      expect(mockWorkflowRunInput.items.length).toBe(1)
      expect(mockWorkflowRunInput.items[0].variant_id).toBe("var_pack_6")
      expect(mockWorkflowRunInput.items[0].quantity).toBe(10)
      expect(mockWorkflowRunInput.items[0].unit_price).toBe(45)

      // Verify seller was linked to the draft order
      const links = getCreatedLinks()
      expect(links.length).toBe(1)
      expect(links[0]).toEqual({
        [Modules.ORDER]: { order_id: mockDraftOrderId },
        [MercurModules.SELLER]: { seller_id: sellerId },
      })

      // Verify inquiry was updated to converted with draft_order_id in metadata
      const updatedInquiry = getUpdatedInquiryPayload()
      expect(updatedInquiry).toBeDefined()
      expect(updatedInquiry.id).toBe(inquiryId)
      expect(updatedInquiry.status).toBe("converted")
      expect(updatedInquiry.metadata?.draft_order_id).toBe(mockDraftOrderId)

      // Verify response body
      const json = getJson()
      expect(json.draft_order).toBeDefined()
      expect(json.draft_order.id).toBe(mockDraftOrderId)
      expect(json.inquiry).toBeDefined()
      expect(json.inquiry.status).toBe("converted")
    })
  })
})
