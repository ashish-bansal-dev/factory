import { describe, expect, it } from "bun:test"
import {
  AdminCreateProduct,
  AdminUpdateProduct,
  CreateRetailVariant,
  CreateWholesaleVariant,
} from "../validators"
import {
  categorizeProductVariants,
  categorizeProductsVariants,
  transformProductVariants,
} from "../../../utils/product-variants"

describe("Product Variants: Retail and Wholesale Schemas & Transformation", () => {
  describe("Zod Validators", () => {
    it("validates a retail variant correctly", () => {
      const validRetail = {
        title: "Medium Singles",
        sku: "RET-M-001",
        mrp: 29.99,
        unit_msrp: 29.99,
        options: { Size: "M" },
      }

      const parsed = CreateRetailVariant.parse(validRetail)
      expect(parsed.title).toBe("Medium Singles")
      expect(parsed.mrp).toBe(29.99)
      expect(parsed.unit_msrp).toBe(29.99)
      expect(parsed.options?.Size).toBe("M")
    })

    it("validates a wholesale pack variant correctly", () => {
      const validWholesale = {
        pack_description: "Prepack Curve 1-2-2-1",
        bundle_size: 6,
        pack_breakdown: { S: 1, M: 2, L: 2, XL: 1 },
        mrp: 30,
        unit_msrp: 30,
        sku: "WHOLE-CURVE-6",
      }

      const parsed = CreateWholesaleVariant.parse(validWholesale)
      expect(parsed.pack_description).toBe("Prepack Curve 1-2-2-1")
      expect(parsed.bundle_size).toBe(6)
      expect(parsed.pack_breakdown).toEqual({ S: 1, M: 2, L: 2, XL: 1 })
      expect(parsed.mrp).toBe(30)
      expect(parsed.unit_msrp).toBe(30)
    })

    it("rejects wholesale variants with invalid bundle_size", () => {
      expect(() => {
        CreateWholesaleVariant.parse({
          pack_description: "Invalid Pack",
          bundle_size: 0,
        })
      }).toThrow()

      expect(() => {
        CreateWholesaleVariant.parse({
          pack_description: "Negative Pack",
          bundle_size: -5,
        })
      }).toThrow()
    })

    it("accepts retail_variants and wholesale_variants in AdminCreateProduct", () => {
      const payload = {
        title: "Master Oxford Shirt",
        retail_variants: [
          {
            title: "Oxford Shirt S",
            sku: "OXF-S",
            mrp: 45,
            options: { Size: "S" },
          },
        ],
        wholesale_variants: [
          {
            pack_description: "Solid Pack 6xM",
            bundle_size: 6,
            pack_breakdown: { M: 6 },
            mrp: 40,
            unit_msrp: 40,
          },
        ],
      }

      const parsed = AdminCreateProduct().parse(payload)
      expect(parsed.retail_variants?.length).toBe(1)
      expect(parsed.wholesale_variants?.length).toBe(1)
      expect(parsed.retail_variants?.[0].sku).toBe("OXF-S")
      expect(parsed.wholesale_variants?.[0].bundle_size).toBe(6)
    })

    it("accepts retail_variants and wholesale_variants in AdminUpdateProduct", () => {
      const payload = {
        title: "Updated Master Oxford Shirt",
        retail_variants: [
          {
            id: "var_ret_1",
            title: "Oxford Shirt M",
            mrp: 48,
          },
        ],
        wholesale_variants: [
          {
            id: "var_who_1",
            pack_description: "Solid Pack 12xL",
            bundle_size: 12,
            mrp: 40,
          },
        ],
      }

      const parsed = AdminUpdateProduct().parse(payload)
      expect(parsed.retail_variants?.length).toBe(1)
      expect(parsed.wholesale_variants?.length).toBe(1)
      expect(parsed.retail_variants?.[0].id).toBe("var_ret_1")
      expect(parsed.wholesale_variants?.[0].id).toBe("var_who_1")
    })
  })

  describe("transformProductVariants", () => {
    it("transforms retail and wholesale variants and enriches metadata", () => {
      const input = {
        title: "Denim Jacket",
        retail_variants: [
          {
            title: "Denim Jacket M",
            sku: "DJ-M",
            mrp: 90,
            unit_msrp: 90,
            metadata: { custom_tag: "spring2026" },
          },
        ],
        wholesale_variants: [
          {
            pack_description: "Prepack 12-Pack",
            bundle_size: 12,
            pack_breakdown: { S: 2, M: 4, L: 4, XL: 2 },
            mrp: 80,
            unit_msrp: 80,
            sku: "DJ-PACK-12",
          },
        ],
      }

      const result = transformProductVariants(input)

      // retail_variants and wholesale_variants should be deleted from input
      expect((result as any).retail_variants).toBeUndefined()
      expect((result as any).wholesale_variants).toBeUndefined()

      expect(result.variants).toBeDefined()
      expect(result.variants!.length).toBe(2)

      const retailVariant = result.variants![0]
      expect(retailVariant.title).toBe("Denim Jacket M")
      expect(retailVariant.sku).toBe("DJ-M")
      expect(retailVariant.metadata).toEqual({
        custom_tag: "spring2026",
        variant_type: "retail",
        mrp: 90,
        unit_msrp: 90,
      })

      const wholesaleVariant = result.variants![1]
      expect(wholesaleVariant.title).toBe("Prepack 12-Pack")
      expect(wholesaleVariant.sku).toBe("DJ-PACK-12")
      expect(wholesaleVariant.metadata).toEqual({
        variant_type: "wholesale",
        pack_description: "Prepack 12-Pack",
        bundle_size: 12,
        pack_breakdown: { S: 2, M: 4, L: 4, XL: 2 },
        mrp: 80,
        unit_msrp: 80,
      })
    })

    it("falls back to pack_description for wholesale variant title and options for retail variant title", () => {
      const input = {
        title: "T-Shirt",
        retail_variants: [
          {
            options: { Color: "Black", Size: "L" },
            sku: "TS-BLK-L",
          },
        ],
        wholesale_variants: [
          {
            pack_description: "Solid Pack 6xL",
            bundle_size: 6,
          },
        ],
      }

      const result = transformProductVariants(input)
      expect(result.variants![0].title).toBe("Black / L")
      expect(result.variants![1].title).toBe("Solid Pack 6xL")
    })

    it("preserves undefined options on wholesale variants without injecting empty objects", () => {
      const input = {
        title: "Sneakers",
        retail_variants: [
          { options: { Size: "42" }, sku: "SNK-42" },
        ],
        wholesale_variants: [
          { pack_description: "Pack of 6", bundle_size: 6, sku: "SNK-WS-6PK" },
        ],
      }
      const result = transformProductVariants(input)
      expect(result.variants![0].options).toEqual({ Size: "42" })
      expect(result.variants![1].options).toBeUndefined()
    })
  })

  describe("categorizeProductVariants and categorizeProductsVariants", () => {
    it("categorizes variants into retail_variants and wholesale_variants on product record", () => {
      const product = {
        id: "prod_1",
        title: "Chino Pants",
        variants: [
          {
            id: "var_1",
            title: "Chino 32",
            metadata: { variant_type: "retail", mrp: 60 },
          },
          {
            id: "var_2",
            title: "Chino Prepack",
            metadata: {
              variant_type: "wholesale",
              pack_description: "Chino 6-Pack",
              bundle_size: 6,
              pack_breakdown: { "30": 2, "32": 2, "34": 2 },
              mrp: 50,
              unit_msrp: 50,
            },
          },
          {
            id: "var_3",
            title: "Chino Legacy Variant Without Variant Type",
            metadata: {},
          },
        ],
      }

      const categorized = categorizeProductVariants(product as any)

      expect(categorized.retail_variants.length).toBe(2)
      expect(categorized.wholesale_variants.length).toBe(1)

      expect(categorized.retail_variants[0].id).toBe("var_1")
      expect(categorized.retail_variants[0].mrp).toBe(60)

      expect(categorized.retail_variants[1].id).toBe("var_3")

      const wholesale = categorized.wholesale_variants[0]
      expect(wholesale.id).toBe("var_2")
      expect(wholesale.pack_description).toBe("Chino 6-Pack")
      expect(wholesale.bundle_size).toBe(6)
      expect(wholesale.pack_breakdown).toEqual({ "30": 2, "32": 2, "34": 2 })
      expect(wholesale.mrp).toBe(50)
      expect(wholesale.unit_msrp).toBe(50)
    })

    it("categorizes variants across an array of products", () => {
      const products = [
        {
          id: "prod_1",
          variants: [
            { id: "v1", metadata: { variant_type: "retail" } },
            { id: "v2", metadata: { variant_type: "wholesale", pack_description: "P1", bundle_size: 6 } },
          ],
        },
        {
          id: "prod_2",
          variants: [
            { id: "v3", metadata: { variant_type: "wholesale", pack_description: "P2", bundle_size: 12 } },
          ],
        },
      ]

      categorizeProductsVariants(products as any)

      expect(products[0].retail_variants.length).toBe(1)
      expect(products[0].wholesale_variants.length).toBe(1)
      expect(products[1].retail_variants.length).toBe(0)
      expect(products[1].wholesale_variants.length).toBe(1)
    })
  })
})
