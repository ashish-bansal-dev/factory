import { WhatsAppClient } from "../whatsapp-client"
import { GeminiVisionService } from "../gemini-vision"
import { WhatsAppManager } from "../whatsapp-manager"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("WhatsAppClient", () => {
  const verifyToken = "test_secret_token_123"
  const client = new WhatsAppClient({
    verifyToken,
    phoneNumberId: "phone_12345",
    accessToken: "eaab_token_67890",
  })

  it("verifies webhook challenge successfully when mode and token match", () => {
    const query = {
      "hub.mode": "subscribe",
      "hub.verify_token": verifyToken,
      "hub.challenge": "challenge_code_999",
    }
    const result = client.verifyWebhook(query)
    expect(result).toBe("challenge_code_999")
  })

  it("rejects webhook challenge when token is incorrect", () => {
    const query = {
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong_token",
      "hub.challenge": "challenge_code_999",
    }
    const result = client.verifyWebhook(query)
    expect(result).toBeNull()
  })

  it("rejects webhook challenge when mode is not subscribe", () => {
    const query = {
      "hub.mode": "unsubscribe",
      "hub.verify_token": verifyToken,
      "hub.challenge": "challenge_code_999",
    }
    const result = client.verifyWebhook(query)
    expect(result).toBeNull()
  })
})

describe("GeminiVisionService", () => {
  it("initializes with default model gemini-2.0-flash", () => {
    const service = new GeminiVisionService("test_key")
    expect(service).toBeDefined()
  })

  it("fails early if GEMINI_API_KEY is missing", async () => {
    const service = new GeminiVisionService("")
    await expect(service.extractProductDetails([])).rejects.toThrow("GEMINI_API_KEY is not set")
  })
})

describe("WhatsAppManager", () => {
  let sentMessages: Array<{ to: string; text: string }> = []
  let mockQueryGraph: any
  let mockContainer: any

  beforeEach(() => {
    sentMessages = []
    process.env.ADMIN_WHATSAPP_PHONE = "919999999999"

    mockQueryGraph = jest.fn(async ({ entity, filters }: any) => {
      if (entity === "seller") {
        if (filters?.phone?.includes("918888888888")) {
          return { data: [{ id: "sel_vendor_1", name: "Acme Vendor", phone: "918888888888" }] }
        }
        if (filters?.$or) {
          return { data: [{ id: "sel_target_2", name: "Nike Store", handle: "nike" }] }
        }
        return { data: [] }
      }
      if (entity === "product") {
        return {
          data: [
            {
              id: "prod_1",
              title: "Linen Shirt",
              status: "published",
              variants: [{ id: "var_1", title: "M", prices: [{ amount: 4500 }] }],
            },
          ],
          metadata: { count: 1 },
        }
      }
      return { data: [] }
    })

    mockContainer = {
      resolve: (key: string) => {
        if (key === ContainerRegistrationKeys.QUERY) {
          return { graph: mockQueryGraph }
        }
        return {}
      },
    }

    // Mock client.sendMessage on the prototype
    jest.spyOn(WhatsAppClient.prototype, "sendMessage").mockImplementation(
      async (to: string, message: string) => {
        sentMessages.push({ to, text: message })
        return true
      }
    )
  })

  it("rejects messages from unknown phone numbers", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "1234567890",
                    id: "msg_1",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "Hello" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    await manager.handleWebhookPayload(payload)
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain("not registered")
  })

  it("authenticates registered vendor and handles LIST PRODUCTS", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "918888888888",
                    id: "msg_2",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "LIST PRODUCTS" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    await manager.handleWebhookPayload(payload)
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain("Products for Acme Vendor")
    expect(sentMessages[0].text).toContain("Linen Shirt")
  })

  it("authenticates admin and allows SWITCH VENDOR", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "919999999999",
                    id: "msg_3",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "VENDOR Nike" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    await manager.handleWebhookPayload(payload)
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain("Active vendor context set to: *Nike Store*")
  })

  it("allows admin to CLEAR VENDOR", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "919999999999",
                    id: "msg_4",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "CLEAR VENDOR" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    await manager.handleWebhookPayload(payload)
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain("Active vendor context cleared")
  })

  it("handles HELP / MENU command", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "waba_1",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                messages: [
                  {
                    from: "919999999999",
                    id: "msg_5",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "HELP" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    await manager.handleWebhookPayload(payload)
    expect(sentMessages.length).toBe(1)
    expect(sentMessages[0].text).toContain("WhatsApp Product Assistant")
    expect(sentMessages[0].text).toContain("Admin Commands")
  })
})
