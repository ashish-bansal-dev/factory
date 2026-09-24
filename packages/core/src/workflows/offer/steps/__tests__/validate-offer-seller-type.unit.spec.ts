import { describe, expect, it } from "bun:test"
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError, createMedusaContainer } from "@medusajs/framework/utils"
import { SellerType } from "@mercurjs/types"
import {
  validateOfferSellerTypeStep,
  ValidateOfferSellerTypeInput,
} from "../validate-offer-seller-type"

describe("validateOfferSellerTypeStep (Milestone 1)", () => {
  // Helper to execute the step within a minimal workflow
  const testWorkflow = createWorkflow("test-validate-offer-seller-type", function (input: ValidateOfferSellerTypeInput) {
    const res = validateOfferSellerTypeStep(input)
    return new WorkflowResponse(res)
  })

  const runStep = async (
    input: ValidateOfferSellerTypeInput,
    mockSellers: Array<{ id: string; type?: string | null }>
  ) => {
    let capturedQuery: any = null
    const mockQuery = {
      graph: async (params: any) => {
        capturedQuery = params
        return {
          data: mockSellers.filter((s) => {
            if (Array.isArray(params.filters?.id)) {
              return params.filters.id.includes(s.id)
            }
            return true
          }),
        }
      },
    }

    const container = createMedusaContainer()
    container.register({
      [ContainerRegistrationKeys.QUERY]: {
        resolve: () => mockQuery,
      },
    })

    const execution = await testWorkflow.run({
      container,
      input,
    })

    return { execution, capturedQuery }
  }

  describe("Retailer Restrictions (Acceptance Criteria)", () => {
    it("rejects wholesale offer when seller.type === 'retailer'", async () => {
      const sellerId = "sel_retailer_1"
      let caughtError: any = null

      try {
        await runStep(
          {
            offers: [
              {
                seller_id: sellerId,
                offer_type: "wholesale",
              } as any,
            ],
          },
          [{ id: sellerId, type: "retailer" }]
        )
      } catch (err: any) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(Boolean(caughtError["__isMedusaError"]) || caughtError instanceof MedusaError).toBe(true)
      expect(caughtError.type).toBe(MedusaError.Types.NOT_ALLOWED)
      expect(caughtError.message).toContain("Retailers are not permitted to create wholesale offers")
      expect(caughtError.message).toContain(sellerId)
    })

    it("rejects wholesale offer when seller.type === SellerType.RETAILER enum", async () => {
      const sellerId = "sel_retailer_enum"
      let caughtError: any = null

      try {
        await runStep(
          {
            offers: [
              {
                seller_id: sellerId,
                offer_type: "wholesale",
              } as any,
            ],
          },
          [{ id: sellerId, type: SellerType.RETAILER }]
        )
      } catch (err: any) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.NOT_ALLOWED)
    })

    it("allows retail offer when seller.type === 'retailer'", async () => {
      const sellerId = "sel_retailer_ok"
      const { execution, capturedQuery } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "retail",
            } as any,
          ],
        },
        [{ id: sellerId, type: "retailer" }]
      )

      expect(execution).toBeDefined()
      // Because all offers are retail, query should be bypassed completely
      expect(capturedQuery).toBeNull()
    })

    it("allows offers where offer_type is omitted (defaults to retail)", async () => {
      const sellerId = "sel_retailer_default"
      const { execution, capturedQuery } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              // offer_type not set
            } as any,
          ],
        },
        [{ id: sellerId, type: "retailer" }]
      )

      expect(execution).toBeDefined()
      expect(capturedQuery).toBeNull()
    })
  })

  describe("Wholesale Permissions for Other Seller Types", () => {
    it("allows wholesale offer when seller.type === 'manufacturer'", async () => {
      const sellerId = "sel_mfr_1"
      const { execution, capturedQuery } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: SellerType.MANUFACTURER }]
      )

      expect(execution).toBeDefined()
      expect(capturedQuery).toBeDefined()
      expect(capturedQuery.filters.id).toEqual([sellerId])
    })

    it("allows wholesale offer when seller.type === 'wholesaler'", async () => {
      const sellerId = "sel_ws_1"
      const { execution } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: SellerType.WHOLESALER }]
      )

      expect(execution).toBeDefined()
    })

    it("allows wholesale offer when seller.type === 'distributor'", async () => {
      const sellerId = "sel_dist_1"
      const { execution } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: SellerType.DISTRIBUTOR }]
      )

      expect(execution).toBeDefined()
    })

    it("allows wholesale offer when seller is untyped/legacy (seller.type === null)", async () => {
      const sellerId = "sel_legacy_null"
      const { execution } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: null }]
      )

      expect(execution).toBeDefined()
    })

    it("allows wholesale offer when seller is untyped/legacy (seller.type === undefined)", async () => {
      const sellerId = "sel_legacy_undef"
      const { execution } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: undefined }]
      )

      expect(execution).toBeDefined()
    })

    it("allows dual offers (retail and wholesale) for manufacturer in same batch", async () => {
      const sellerId = "sel_mfr_dual"
      const { execution, capturedQuery } = await runStep(
        {
          offers: [
            {
              seller_id: sellerId,
              sku: "DUAL-SKU",
              offer_type: "retail",
            } as any,
            {
              seller_id: sellerId,
              sku: "DUAL-SKU",
              offer_type: "wholesale",
            } as any,
          ],
        },
        [{ id: sellerId, type: SellerType.MANUFACTURER }]
      )

      expect(execution).toBeDefined()
      expect(capturedQuery.filters.id).toEqual([sellerId])
    })
  })

  describe("Batch Processing & Edge Cases", () => {
    it("handles batch with multiple sellers: passes when retailer only has retail offers", async () => {
      const mfrId = "sel_mfr_batch"
      const retId = "sel_ret_batch"

      const { execution } = await runStep(
        {
          offers: [
            { seller_id: mfrId, offer_type: "wholesale" } as any,
            { seller_id: retId, offer_type: "retail" } as any,
          ],
        },
        [
          { id: mfrId, type: "manufacturer" },
          { id: retId, type: "retailer" },
        ]
      )

      expect(execution).toBeDefined()
    })

    it("handles batch with multiple sellers: rejects when retailer has wholesale offer", async () => {
      const mfrId = "sel_mfr_batch_2"
      const retId = "sel_ret_batch_2"
      let caughtError: any = null

      try {
        await runStep(
          {
            offers: [
              { seller_id: mfrId, offer_type: "wholesale" } as any,
              { seller_id: retId, offer_type: "wholesale" } as any,
            ],
          },
          [
            { id: mfrId, type: "manufacturer" },
            { id: retId, type: "retailer" },
          ]
        )
      } catch (err: any) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.message).toContain(retId)
    })

    it("deduplicates seller IDs when multiple wholesale offers exist from the same seller", async () => {
      const mfrId = "sel_mfr_multi_offers"
      const { capturedQuery } = await runStep(
        {
          offers: [
            { seller_id: mfrId, sku: "SKU-1", offer_type: "wholesale" } as any,
            { seller_id: mfrId, sku: "SKU-2", offer_type: "wholesale" } as any,
            { seller_id: mfrId, sku: "SKU-3", offer_type: "wholesale" } as any,
          ],
        },
        [{ id: mfrId, type: "manufacturer" }]
      )

      expect(capturedQuery.filters.id).toEqual([mfrId])
      expect(capturedQuery.filters.id.length).toBe(1)
    })

    it("passes immediately when offers array is empty", async () => {
      const { execution, capturedQuery } = await runStep(
        { offers: [] },
        []
      )

      expect(execution).toBeDefined()
      expect(capturedQuery).toBeNull()
    })
  })
})
