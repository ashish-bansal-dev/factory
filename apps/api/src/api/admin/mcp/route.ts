import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@mercurjs/core/workflows"

interface McpJsonRpcRequest {
  jsonrpc: "2.0"
  id: string | number
  method: string
  params?: any
}

const MCP_TOOLS = [
  {
    name: "create_marketplace_product",
    description:
      "Creates and publishes a new marketplace product in Mercur attributed to a seller.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Product title" },
        description: { type: "string", description: "Product description" },
        price: { type: "number", description: "Base product price in standard units (e.g. 45.00)" },
        currency_code: { type: "string", description: "Currency code (default 'usd')" },
        seller_id: { type: "string", description: "Seller/Vendor ID to attribute the product to" },
        category_name: { type: "string", description: "Product category name" },
        images: {
          type: "array",
          items: { type: "string" },
          description: "List of publicly accessible image URLs",
        },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              values: { type: "array", items: { type: "string" } },
            },
          },
        },
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              price: { type: "number" },
              sku: { type: "string" },
            },
          },
        },
      },
      required: ["title", "price"],
    },
  },
  {
    name: "list_seller_products",
    description: "Lists products belonging to a seller or the entire marketplace.",
    inputSchema: {
      type: "object",
      properties: {
        seller_id: { type: "string", description: "Optional seller ID to filter by" },
        limit: { type: "number", description: "Max products to return (default 10)" },
        offset: { type: "number", description: "Offset for pagination (default 0)" },
      },
    },
  },
  {
    name: "get_seller_by_phone",
    description: "Look up a seller by their registered WhatsApp / contact phone number.",
    inputSchema: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Phone number (with or without +)" },
      },
      required: ["phone"],
    },
  },
  {
    name: "list_sellers",
    description: "Lists all registered sellers in the marketplace.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Limit (default 20)" },
      },
    },
  },
]

export async function POST(req: MedusaRequest<McpJsonRpcRequest>, res: MedusaResponse) {
  const { id, method, params } = req.body || {}
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // 1. MCP Handshake / Initialize
  if (method === "initialize") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: {
          name: "mercur-marketplace-mcp",
          version: "1.0.0",
        },
      },
    })
  }

  // 2. Tools List
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: MCP_TOOLS,
      },
    })
  }

  // 3. Tools Call
  if (method === "tools/call") {
    const toolName = params?.name
    const args = params?.arguments || {}

    try {
      if (toolName === "get_seller_by_phone") {
        const cleanPhone = String(args.phone).replace(/[^0-9]/g, "")
        const { data: sellers } = await query.graph({
          entity: "seller",
          fields: ["id", "name", "handle", "phone", "email"],
          filters: { phone: [cleanPhone, `+${cleanPhone}`] },
        })

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(sellers?.[0] || null, null, 2) }],
          },
        })
      }

      if (toolName === "list_sellers") {
        const { data: sellers } = await query.graph({
          entity: "seller",
          fields: ["id", "name", "handle", "phone"],
          pagination: { take: args.limit || 20 },
        })

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(sellers, null, 2) }],
          },
        })
      }

      if (toolName === "list_seller_products") {
        const filters: any = {}
        if (args.seller_id) {
          filters["seller_id"] = args.seller_id
        }

        const { data: products, metadata } = await query.graph({
          entity: "product",
          fields: ["id", "title", "handle", "status", "variants.*"],
          filters,
          pagination: { skip: args.offset || 0, take: args.limit || 10 },
        })

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify({ count: metadata?.count ?? products.length, products }, null, 2),
              },
            ],
          },
        })
      }

      if (toolName === "create_marketplace_product") {
        const priceAmount = Math.round(Number(args.price) * 100)
        const currencyCode = (args.currency_code || "usd").toLowerCase()

        const variants =
          args.variants && args.variants.length > 0
            ? args.variants.map((v: any) => ({
                title: v.title || "Default",
                sku: v.sku,
                prices: [
                  {
                    currency_code: currencyCode,
                    amount: Math.round((v.price ?? args.price) * 100),
                  },
                ],
              }))
            : [
                {
                  title: "Default",
                  prices: [{ currency_code: currencyCode, amount: priceAmount }],
                },
              ]

        const productPayload: any = {
          title: args.title,
          description: args.description || "",
          status: ProductStatus.PUBLISHED,
          images: (args.images || []).map((url: string) => ({ url })),
          thumbnail: args.images?.[0],
          variants,
          metadata: {
            listing_scope: "store_only",
            created_via: "mcp",
          },
        }

        if (args.seller_id) {
          productPayload.seller_ids = [args.seller_id]
        }

        const { result } = await createProductsWorkflow(req.scope).run({
          input: {
            products: [productPayload],
            created_by: args.seller_id || "mcp_agent",
          },
        })

        const createdId = (result as { id: string }[])[0].id

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    productId: createdId,
                    sellerId: args.seller_id,
                    title: args.title,
                  },
                  null,
                  2
                ),
              },
            ],
          },
        })
      }

      return res.status(404).json({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Tool not found: ${toolName}` },
      })
    } catch (e: any) {
      return res.status(500).json({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: e.message },
      })
    }
  }

  return res.status(400).json({
    jsonrpc: "2.0",
    id,
    error: { code: -32600, message: "Invalid Request" },
  })
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    name: "mercur-marketplace-mcp",
    status: "healthy",
    transport: "HTTP POST JSON-RPC 2.0",
    documentation: "https://modelcontextprotocol.io",
  })
}
