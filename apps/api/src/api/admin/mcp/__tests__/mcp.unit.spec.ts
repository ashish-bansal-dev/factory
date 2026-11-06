import { POST, GET } from "../route"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("MCP Endpoint (/admin/mcp)", () => {
  let mockQueryGraph: any
  let mockScope: any
  let mockResponse: any
  let jsonResult: any
  let statusResult: number

  beforeEach(() => {
    jsonResult = null
    statusResult = 200

    mockQueryGraph = jest.fn(async ({ entity }: any) => {
      if (entity === "seller") {
        return { data: [{ id: "sel_123", name: "Acme Corp", phone: "919999999999" }] }
      }
      if (entity === "product") {
        return { data: [{ id: "prod_1", title: "Linen Shirt" }], metadata: { count: 1 } }
      }
      return { data: [] }
    })

    mockScope = {
      resolve: (key: string) => {
        if (key === ContainerRegistrationKeys.QUERY) {
          return { graph: mockQueryGraph }
        }
        return {}
      },
    }

    mockResponse = {
      status: (code: number) => {
        statusResult = code
        return mockResponse
      },
      json: (data: any) => {
        jsonResult = data
        return mockResponse
      },
    }
  })

  it("handles GET /admin/mcp health check", async () => {
    await GET({} as any, mockResponse)
    expect(jsonResult.name).toBe("mercur-marketplace-mcp")
    expect(jsonResult.status).toBe("healthy")
  })

  it("responds to initialize method", async () => {
    const req = {
      body: { jsonrpc: "2.0", id: 1, method: "initialize" },
      scope: mockScope,
    } as any

    await POST(req, mockResponse)
    expect(jsonResult.result.serverInfo.name).toBe("mercur-marketplace-mcp")
  })

  it("returns available tools on tools/list", async () => {
    const req = {
      body: { jsonrpc: "2.0", id: 2, method: "tools/list" },
      scope: mockScope,
    } as any

    await POST(req, mockResponse)
    expect(jsonResult.result.tools.length).toBeGreaterThanOrEqual(4)
    const toolNames = jsonResult.result.tools.map((t: any) => t.name)
    expect(toolNames).toContain("create_marketplace_product")
    expect(toolNames).toContain("list_seller_products")
    expect(toolNames).toContain("get_seller_by_phone")
  })

  it("executes get_seller_by_phone on tools/call", async () => {
    const req = {
      body: {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "get_seller_by_phone",
          arguments: { phone: "919999999999" },
        },
      },
      scope: mockScope,
    } as any

    await POST(req, mockResponse)
    expect(jsonResult.result.content[0].text).toContain("Acme Corp")
  })

  it("returns error for unknown tool", async () => {
    const req = {
      body: {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "non_existent_tool",
          arguments: {},
        },
      },
      scope: mockScope,
    } as any

    await POST(req, mockResponse)
    expect(statusResult).toBe(404)
    expect(jsonResult.error.code).toBe(-32601)
  })
})
