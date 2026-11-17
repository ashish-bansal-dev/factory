import { BulkAiUploader } from "../bulk-ai-uploader"

describe("BulkAiUploader", () => {
  it("rejects processing when no images are provided", async () => {
    const mockContainer = {} as any
    const uploader = new BulkAiUploader(mockContainer, "test-key")

    expect(
      uploader.processBatch({
        sellerId: "sel_123",
        images: [],
      })
    ).rejects.toThrow("At least one product image is required")
  })

  it("rejects processing when no sellerId is provided", async () => {
    const mockContainer = {} as any
    const uploader = new BulkAiUploader(mockContainer, "test-key")

    expect(
      uploader.processBatch({
        sellerId: "",
        images: [{ buffer: Buffer.from("fake") }],
      })
    ).rejects.toThrow("sellerId is required")
  })

  it("resolves existing brand case-insensitively", async () => {
    const mockGraph = async () => ({
      data: [
        { id: "brand_nike", name: "Nike", handle: "nike" },
        { id: "brand_adidas", name: "Adidas", handle: "adidas" },
      ],
    })

    const mockContainer = {
      resolve: () => ({
        graph: mockGraph,
      }),
    } as any

    const uploader = new BulkAiUploader(mockContainer, "test-key")
    const brand = await uploader.resolveExistingBrand("NIKE")

    expect(brand).toEqual({ id: "brand_nike", name: "Nike" })

    const missing = await uploader.resolveExistingBrand("Unknown Brand")
    expect(missing).toBeNull()
  })

  it("builds a default wholesale variant without MRP and quantity=1", () => {
    const mockContainer = {} as any
    const uploader = new BulkAiUploader(mockContainer, "test-key")

    const variant = (uploader as any).buildDefaultWholesaleVariant("Art 101 Shoes", {
      title: "Art 101 Shoes",
      article_number: "ART-101",
      wholesale_price: 350,
      currency_code: "inr",
      mrp: 1299,
    })

    expect(variant.title).toBe("Default Wholesale")
    expect(variant.sku).toContain("ART101-WS")
    expect(variant.prices).toEqual([{ currency_code: "inr", amount: 35000 }])
    expect(variant.metadata.variant_type).toBe("wholesale")
    expect(variant.metadata.bundle_size).toBe(1)
    expect(variant.metadata.wholesale_unit_price).toBe(350)
    expect(variant.metadata.mrp).toBeUndefined()
  })
})

