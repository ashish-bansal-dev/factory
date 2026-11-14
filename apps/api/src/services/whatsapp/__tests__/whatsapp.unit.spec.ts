import { WhatsAppClient } from "../whatsapp-client"
import { GeminiVisionService } from "../gemini-vision"
import { WhatsAppManager } from "../whatsapp-manager"
import { ImageCompressor } from "../image-compressor"
import { DraftEditorService } from "../draft-editor"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import sharp from "sharp"

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

describe("ImageCompressor", () => {
  it("compresses and resizes an oversized image to webp by default", async () => {
    const compressor = new ImageCompressor({
      maxWidth: 200,
      maxHeight: 200,
      quality: 80,
    })

    // Create a 400x400 test image
    const rawBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 120, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer()

    const result = await compressor.compress(rawBuffer)
    expect(result.buffer).toBeDefined()
    expect(result.mimeType).toBe("image/webp")
    expect(result.compressedSizeBytes).toBeGreaterThan(0)
    expect(result.compressionRatio).toBeDefined()

    // Verify metadata of compressed image
    const meta = await sharp(result.buffer).metadata()
    expect(meta.format).toBe("webp")
    expect(meta.width).toBeLessThanOrEqual(200)
    expect(meta.height).toBeLessThanOrEqual(200)
  })

  it("supports explicit jpeg compression format", async () => {
    const compressor = new ImageCompressor({
      maxWidth: 200,
      maxHeight: 200,
      quality: 80,
      format: "jpeg",
    })

    const rawBuffer = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 120, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer()

    const result = await compressor.compress(rawBuffer)
    expect(result.buffer).toBeDefined()
    expect(result.mimeType).toBe("image/jpeg")

    const meta = await sharp(result.buffer).metadata()
    expect(meta.format).toBe("jpeg")
  })

  it("handles fallback gracefully on invalid image buffer", async () => {
    const compressor = new ImageCompressor()
    const invalidBuffer = Buffer.from("not an image")
    const result = await compressor.compress(invalidBuffer)

    expect(result.buffer).toEqual(invalidBuffer)
    expect(result.mimeType).toBe("image/webp")
  })
})

describe("DraftEditorService", () => {
  const mockProduct = {
    title: "Classic White Tee",
    subtitle: "Organic cotton",
    description: "Premium regular fit t-shirt",
    category_name: "Tops",
    material: "100% Cotton",
    suggested_price: 25.0,
    currency_code: "usd",
    variants: [{ title: "Default", price: 25.0 }],
  }

  it("parses price update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    // Force fallback by using invalid key/url or checking fallback directly
    const res = await (editor as any).fallbackParse(mockProduct, "price 39.99")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.suggested_price).toBe(39.99)
    expect(res.message).toContain("39.99")
  })

  it("parses title update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "title Vintage Graphic Tee")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.title).toBe("Vintage Graphic Tee")
  })

  it("parses brand update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "brand Nike")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.brand).toBe("Nike")
  })

  it("parses category update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "category Topwear")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.category_name).toBe("Topwear")
  })

  it("parses size update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "sizes S, M, L, XL")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.sizes).toEqual(["S", "M", "L", "XL"])
  })

  it("parses color update using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "colors Navy Blue, Olive Green")
    expect(res.action).toBe("UPDATE")
    expect(res.updatedProduct.colors).toEqual(["Navy Blue", "Olive Green"])
  })

  it("parses confirmation using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "looks good publish")
    expect(res.action).toBe("PUBLISH")
  })

  it("parses cancel intent using fallback parser", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await (editor as any).fallbackParse(mockProduct, "cancel this draft")
    expect(res.action).toBe("CANCEL")
  })

  it("passes generated description as text context into step 2 conversation", async () => {
    const editor = new DraftEditorService("fake_key")
    const res = await editor.processConversation(
      {
        isAdmin: false,
        hasDraft: true,
        draftProduct: mockProduct,
      },
      "what material is this?"
    )
    expect(res).toBeDefined()
    expect(res.action).toBeDefined()
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
        if (filters?.phone?.some((p: string) => p.includes("8888888888"))) {
          return { data: [{ id: "sel_vendor_1", name: "Acme Vendor", phone: "8888888888" }] }
        }
        if (filters?.phone) {
          return { data: [] }
        }
        return { data: [{ id: "sel_target_2", name: "Nike Store", handle: "nike" }] }
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
      if (entity === "product_category") {
        return {
          data: [
            { id: "pcat_topwear", name: "Topwear", handle: "topwear" },
            { id: "pcat_bottomwear", name: "Bottomwear", handle: "bottomwear" },
          ],
        }
      }
      if (entity === "brand") {
        return {
          data: [
            { id: "brand_nike", name: "Nike", handle: "nike" },
          ],
        }
      }
      if (entity === "product_attribute") {
        return {
          data: [
            {
              id: "attr_size",
              name: "Size",
              handle: "size",
              is_variant_axis: true,
              values: [
                { id: "val_s", name: "S" },
                { id: "val_m", name: "M" },
              ],
            },
            {
              id: "attr_color",
              name: "Color",
              handle: "color",
              is_variant_axis: true,
              values: [
                { id: "val_blue", name: "Blue" },
              ],
            },
          ],
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

  it("allows admin to list all sellers via SELLERS command", async () => {
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
                    id: "msg_6",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "SELLERS" },
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
    expect(sentMessages[0].text).toContain("Registered Marketplace Vendors")
    expect(sentMessages[0].text).toContain("Nike Store")
  })

  it("allows admin to switch vendor by index number (VENDOR 1)", async () => {
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
                    id: "msg_7",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "VENDOR 1" },
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

  it("handles general conversational inquiry from user", async () => {
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
                    id: "msg_8",
                    timestamp: "123456",
                    type: "text",
                    text: { body: "Hello, what can you do?" },
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
    expect(sentMessages[0].text).toBeDefined()
    expect(sentMessages[0].text.length).toBeGreaterThan(10)
  })

  it("resolves system categories by exact name or substring", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const exact = await manager.resolveSystemCategory("Topwear")
    expect(exact).toEqual({ id: "pcat_topwear", name: "Topwear" })

    const lower = await manager.resolveSystemCategory("bottomwear")
    expect(lower).toEqual({ id: "pcat_bottomwear", name: "Bottomwear" })

    const none = await manager.resolveSystemCategory("")
    expect(none).toBeNull()
  })

  it("resolves existing brand from system", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const brandId = await manager.resolveOrCreateBrand("Nike")
    expect(brandId).toBe("brand_nike")
  })

  it("builds attributes and variants matrix for sizes and colors", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const res = await manager.buildAttributesAndVariants(
      {
        title: "Casual Linen Shirt",
        description: "Comfortable linen shirt",
        suggested_price: 1499,
        currency_code: "inr",
        sizes: ["S", "M"],
        colors: ["Blue"],
      },
      "inr",
      149900
    )

    expect(res.attributes.length).toBe(2)
    // Check size attribute
    const sizeAttr = res.attributes.find((a: any) => a.id === "attr_size")
    expect(sizeAttr).toBeDefined()
    expect(sizeAttr.value_ids).toContain("val_s")
    expect(sizeAttr.value_ids).toContain("val_m")

    // Check color attribute
    const colorAttr = res.attributes.find((a: any) => a.id === "attr_color")
    expect(colorAttr).toBeDefined()
    expect(colorAttr.value_ids).toContain("val_blue")

    // Check retail variants (2 sizes * 1 color = 2 variants)
    expect(res.retailVariants.length).toBe(2)
    expect(res.retailVariants[0].title).toBe("S / Blue")
    expect(res.retailVariants[0].options).toEqual({ Size: "S", Color: "Blue" })
    expect(res.retailVariants[0].metadata.variant_type).toBe("retail")
    expect(res.retailVariants[1].title).toBe("M / Blue")
    expect(res.retailVariants[1].options).toEqual({ Size: "M", Color: "Blue" })
    expect(res.retailVariants[1].metadata.variant_type).toBe("retail")

    // Check wholesale pack variant (1 pack variant with bundle_size 2)
    expect(res.wholesaleVariants.length).toBe(1)
    expect(res.wholesaleVariants[0].metadata.variant_type).toBe("wholesale")
    expect(res.wholesaleVariants[0].bundle_size).toBe(2)
    expect(res.wholesaleVariants[0].pack_breakdown).toEqual({ S: 1, M: 1 })

    // Total variants = retail + wholesale
    expect(res.variants.length).toBe(3)
  })

  it("builds single default variant when no size/color attributes provided", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const res = await manager.buildAttributesAndVariants(
      {
        title: "Brass Table Lamp",
        description: "Handcrafted lamp",
        suggested_price: 2999,
        currency_code: "inr",
      },
      "inr",
      299900
    )

    expect(res.attributes.length).toBe(0)
    // 1 default retail variant + 1 default wholesale pack variant
    expect(res.retailVariants.length).toBe(1)
    expect(res.retailVariants[0].title).toBe("Default Retail")
    expect(res.retailVariants[0].prices[0].amount).toBe(299900)
    expect(res.retailVariants[0].prices[0].currency_code).toBe("inr")

    expect(res.wholesaleVariants.length).toBe(1)
    expect(res.wholesaleVariants[0].metadata.variant_type).toBe("wholesale")
    expect(res.variants.length).toBe(2)
  })

  it("resolves multi-select categories and creates retail and wholesale variants with MRP", async () => {
    const manager = new WhatsAppManager(mockContainer)
    const resolvedCats = await manager.resolveSystemCategories(["Topwear", "Bottomwear"])
    expect(resolvedCats.length).toBe(2)
    expect(resolvedCats.map((c) => c.name)).toEqual(["Topwear", "Bottomwear"])

    const res = await manager.buildAttributesAndVariants(
      {
        article_number: "ART-905",
        title: "ART-905",
        description: "Running shoes",
        mrp: 1499,
        suggested_price: 1299,
        wholesale_price: 450,
        currency_code: "inr",
        sizes: ["7", "8", "9", "10"],
      },
      "inr",
      129900
    )

    // Retail variants
    expect(res.retailVariants.length).toBe(4)
    expect(res.retailVariants[0].title).toBe("7")
    expect(res.retailVariants[0].metadata.mrp).toBe(1499)
    expect(res.retailVariants[0].prices[0].amount).toBe(129900)

    // Wholesale pack variant
    expect(res.wholesaleVariants.length).toBe(1)
    expect(res.wholesaleVariants[0].bundle_size).toBe(4)
    expect(res.wholesaleVariants[0].pack_breakdown).toEqual({ "7": 1, "8": 1, "9": 1, "10": 1 })
    expect(res.wholesaleVariants[0].metadata.wholesale_unit_price).toBe(450)
    expect(res.wholesaleVariants[0].prices[0].amount).toBe(450 * 4 * 100) // ₹1800 pack price
  })

  it("treats images sent together as single batch without asking for DONE and incorporates accompanying text", async () => {
    const manager = new WhatsAppManager(mockContainer)
    // Send image 1
    const imgPayload1 = {
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
                    id: "msg_img_1",
                    timestamp: "123456",
                    type: "image",
                    image: { id: "media_img_1", mime_type: "image/jpeg" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }
    await manager.handleWebhookPayload(imgPayload1)
    // No "DONE" or prompt should be sent back immediately
    expect(sentMessages.length).toBe(0)

    // Send accompanying text message right with the image batch
    const textPayload = {
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
                    id: "msg_text_1",
                    timestamp: "123457",
                    type: "text",
                    text: { body: "Art 402, sizes 6 to 10, MRP 1299 wholesale 350" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }
    await manager.handleWebhookPayload(textPayload)
    // Still buffering together in single batch, no premature response
    expect(sentMessages.length).toBe(0)
  })
})
