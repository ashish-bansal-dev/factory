import { BrandAiService } from "../brand-ai-service"

describe("BrandAiService", () => {
  it("rejects brand creation when name is empty", async () => {
    const mockContainer = {} as any
    const service = new BrandAiService(mockContainer)

    expect(service.createBrand({ name: "" })).rejects.toThrow("Brand name is required")
  })

  it("rejects brand deletion when identifier is empty", async () => {
    const mockContainer = {} as any
    const service = new BrandAiService(mockContainer)

    expect(service.deleteBrand("")).rejects.toThrow("Brand name or ID is required for deletion")
  })

  it("handles fast command for LIST BRANDS / BRANDS without calling AI", async () => {
    const mockContainer = {
      resolve: () => ({
        graph: async () => ({
          data: [
            { id: "brand_nike", name: "Nike", handle: "nike" },
            { id: "brand_puma", name: "Puma", handle: "puma" },
          ],
        }),
      }),
    } as any

    const service = new BrandAiService(mockContainer)
    const res = await service.processBrandCommand("BRANDS")

    expect(res.action).toBe("LIST")
    expect(res.success).toBe(true)
    expect(res.brands?.length).toBe(2)
    expect(res.message).toContain("Nike")
    expect(res.message).toContain("Puma")
  })
})
