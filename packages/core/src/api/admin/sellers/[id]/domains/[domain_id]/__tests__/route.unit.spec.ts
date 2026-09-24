import { describe, expect, it } from "bun:test"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import { GET, POST, DELETE } from "../route"

describe("Admin Seller Domain Route (/admin/sellers/:id/domains/:domain_id)", () => {
  const sellerId = "sel_test_123"
  const domainId = "dom_test_456"

  const createMockReq = ({
    params = { id: sellerId, domain_id: domainId },
    body = {},
    existingMappings = [],
    allMappings = [],
  }: {
    params?: Record<string, string>
    body?: Record<string, unknown>
    existingMappings?: Array<Record<string, unknown>>
    allMappings?: Array<Record<string, unknown>>
  }) => {
    let updatedPayload: Record<string, unknown> | null = null
    let deletedId: string | null = null

    const mockQuery = {
      graph: async ({ entity, filters }: { entity: string; filters: Record<string, unknown> }) => {
        if (entity === "domain_mapping") {
          if (filters.id && filters.seller_id) {
            return {
              data: existingMappings.filter(
                (m) => m.id === filters.id && m.seller_id === filters.seller_id
              ),
            }
          }
          if (filters.domain) {
            return {
              data: (allMappings.length ? allMappings : existingMappings).filter(
                (m) => m.domain === filters.domain
              ),
            }
          }
        }
        return { data: [] }
      },
    }

    const mockDomainService = {
      updateDomainMappings: async (payload: Record<string, unknown>) => {
        updatedPayload = payload
        return {
          id: payload.id,
          ...existingMappings.find((m) => m.id === payload.id),
          ...payload,
        }
      },
      deleteDomainMappings: async (id: string) => {
        deletedId = id
      },
    }

    const req: any = {
      params,
      body,
      scope: {
        resolve: (key: string) => {
          if (key === ContainerRegistrationKeys.QUERY) return mockQuery
          if (key === MercurModules.DOMAIN) return mockDomainService
          throw new Error(`Unknown registration key ${key}`)
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
      getUpdatedPayload: () => updatedPayload,
      getDeletedId: () => deletedId,
    }
  }

  const existingMapping = {
    id: domainId,
    seller_id: sellerId,
    domain: "oldbrand.com",
    channel_type: "retail",
    is_custom_domain: true,
    verification_status: "verified",
    verification_token: "old-token-123",
    verified_at: new Date(),
    subscription_status: "active",
    branding_config: null,
  }

  describe("GET", () => {
    it("returns domain mapping when found", async () => {
      const { req, res, getStatus, getJson } = createMockReq({
        existingMappings: [existingMapping],
      })

      await GET(req, res)

      expect(getStatus()).toBe(200)
      expect(getJson().domain).toBeDefined()
      expect(getJson().domain.domain).toBe("oldbrand.com")
    })

    it("throws 404 when domain mapping not found for seller", async () => {
      const { req, res } = createMockReq({
        existingMappings: [],
      })

      let caughtError: any = null
      try {
        await GET(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.NOT_FOUND)
    })
  })

  describe("POST (Edit Custom Domain)", () => {
    it("updates domain name, normalizes it, and resets verification token and status", async () => {
      const { req, res, getStatus, getJson, getUpdatedPayload } = createMockReq({
        existingMappings: [existingMapping],
        body: { domain: "https://NEW-BRAND.COM/store" },
      })

      await POST(req, res)

      expect(getStatus()).toBe(200)
      const payload = getUpdatedPayload()
      expect(payload).toBeDefined()
      expect(payload?.domain).toBe("new-brand.com")
      expect(payload?.verification_status).toBe("pending")
      expect(payload?.verified_at).toBeNull()
      expect(typeof payload?.verification_token).toBe("string")
      expect((payload?.verification_token as string).startsWith("mercur-verify-")).toBe(true)

      const json = getJson()
      expect(json.domain.domain).toBe("new-brand.com")
    })

    it("throws 400 INVALID_DATA if domain is empty or whitespace", async () => {
      const { req, res } = createMockReq({
        existingMappings: [existingMapping],
        body: { domain: "   " },
      })

      let caughtError: any = null
      try {
        await POST(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.INVALID_DATA)
    })

    it("throws 409 DUPLICATE_ERROR if domain is already registered by another seller", async () => {
      const otherMapping = {
        id: "dom_other_789",
        seller_id: "sel_other",
        domain: "taken.com",
      }

      const { req, res } = createMockReq({
        existingMappings: [existingMapping],
        allMappings: [existingMapping, otherMapping],
        body: { domain: "taken.com" },
      })

      let caughtError: any = null
      try {
        await POST(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.DUPLICATE_ERROR)
      expect(caughtError.message).toContain("already registered")
    })

    it("allows updating domain to the same name without duplicate error or resetting verification", async () => {
      const { req, res, getStatus, getUpdatedPayload } = createMockReq({
        existingMappings: [existingMapping],
        body: { domain: "oldbrand.com", subscription_status: "trial" },
      })

      await POST(req, res)

      expect(getStatus()).toBe(200)
      const payload = getUpdatedPayload()
      expect(payload?.domain).toBeUndefined()
      expect(payload?.subscription_status).toBe("trial")
    })

    it("allows updating channel_type and branding_config", async () => {
      const { req, res, getStatus, getUpdatedPayload } = createMockReq({
        existingMappings: [existingMapping],
        body: {
          channel_type: "wholesale",
          branding_config: { primary_color: "#123456" },
        },
      })

      await POST(req, res)

      expect(getStatus()).toBe(200)
      const payload = getUpdatedPayload()
      expect(payload?.channel_type).toBe("wholesale")
      expect(payload?.branding_config).toEqual({ primary_color: "#123456" })
    })
  })

  describe("DELETE", () => {
    it("deletes domain mapping when found", async () => {
      const { req, res, getStatus, getJson, getDeletedId } = createMockReq({
        existingMappings: [existingMapping],
      })

      await DELETE(req, res)

      expect(getStatus()).toBe(200)
      expect(getDeletedId()).toBe(domainId)
      expect(getJson()).toEqual({
        id: domainId,
        object: "domain_mapping",
        deleted: true,
      })
    })

    it("throws 404 when domain mapping not found to delete", async () => {
      const { req, res } = createMockReq({
        existingMappings: [],
      })

      let caughtError: any = null
      try {
        await DELETE(req, res)
      } catch (err) {
        caughtError = err
      }

      expect(caughtError).toBeDefined()
      expect(caughtError.type).toBe(MedusaError.Types.NOT_FOUND)
    })
  })
})
