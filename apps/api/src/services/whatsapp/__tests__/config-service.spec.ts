import { WhatsAppConfigService } from "../config-service"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

describe("WhatsAppConfigService", () => {
  let mockStore: any
  let mockContainer: any
  let mockQueryGraph: any

  beforeEach(() => {
    mockStore = {
      id: "store_test_1",
      name: "Test Store",
      metadata: {
        whatsapp_ai_config: {
          whatsapp_phone_number_id: "phone_db_123",
          whatsapp_access_token: "token_db_abc",
          whatsapp_verify_token: "verify_db_xyz",
          admin_whatsapp_phone: "919876543210",
          gemini_api_key: "gemini_db_key",
          gemini_model: "gemini-3.5-flash-lite",
          text_model: "gemma-4-31b-it",
          storefront_url: "https://shop.example.com",
          vendor_url: "https://vendor.example.com",
        },
      },
    }

    mockQueryGraph = jest.fn(async ({ entity }: any) => {
      if (entity === "store") {
        return { data: [mockStore] }
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
  })

  it("loads configuration from database store.metadata", async () => {
    const service = new WhatsAppConfigService(mockContainer)
    const config = await service.getConfig()

    expect(config.whatsapp_phone_number_id).toBe("phone_db_123")
    expect(config.whatsapp_access_token).toBe("token_db_abc")
    expect(config.whatsapp_verify_token).toBe("verify_db_xyz")
    expect(config.admin_whatsapp_phone).toBe("919876543210")
    expect(config.gemini_api_key).toBe("gemini_db_key")
    expect(config.gemini_model).toBe("gemini-3.5-flash-lite")
    expect(config.text_model).toBe("gemma-4-31b-it")
    expect(config.storefront_url).toBe("https://shop.example.com")
    expect(config.vendor_url).toBe("https://vendor.example.com")
  })

  it("falls back to environment variables when database config is empty", async () => {
    mockStore.metadata = {}
    process.env.WHATSAPP_PHONE_NUMBER_ID = "env_phone_id"
    process.env.WHATSAPP_ACCESS_TOKEN = "env_access_token"
    process.env.WHATSAPP_VERIFY_TOKEN = "env_verify_token"
    process.env.ADMIN_WHATSAPP_PHONE = "919999999999"
    process.env.GEMINI_API_KEY = "env_gemini_key"

    const service = new WhatsAppConfigService(mockContainer)
    const config = await service.getConfig()

    expect(config.whatsapp_phone_number_id).toBe("env_phone_id")
    expect(config.whatsapp_access_token).toBe("env_access_token")
    expect(config.whatsapp_verify_token).toBe("env_verify_token")
    expect(config.admin_whatsapp_phone).toBe("919999999999")
    expect(config.gemini_api_key).toBe("env_gemini_key")
  })
})
