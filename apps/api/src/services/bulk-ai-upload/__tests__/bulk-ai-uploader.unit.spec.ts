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
})

