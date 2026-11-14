import { describe, expect, test, vi } from "vitest"

vi.mock("virtual:mercur/i18n", () => ({
  default: {},
}))
vi.mock("virtual:mercur/config", () => ({
  default: {},
}))

import { ProductCreateSchema, ProductCreateVariantSchema } from "../constants"
import { normalizeProductFormValues, normalizeVariants } from "../utils"
import { ProductCreateSchemaType } from "../types"

describe("Retail & Wholesale Product Variants in Admin Create Form", () => {
  describe("ProductCreateVariantSchema", () => {
    test("defaults variant_type to retail", () => {
      const parsed = ProductCreateVariantSchema.parse({
        should_create: true,
        title: "Size M",
        variant_rank: 0,
      })

      expect(parsed.variant_type).toBe("retail")
    })

    test("accepts wholesale variant fields", () => {
      const parsed = ProductCreateVariantSchema.parse({
        should_create: true,
        title: "Prepack 6x",
        variant_rank: 0,
        variant_type: "wholesale",
        pack_description: "Solid Pack 6xM",
        bundle_size: 6,
        mrp: 120,
      })

      expect(parsed.variant_type).toBe("wholesale")
      expect(parsed.pack_description).toBe("Solid Pack 6xM")
      expect(parsed.bundle_size).toBe(6)
      expect(parsed.mrp).toBe(120)
    })
  })

  describe("ProductCreateSchema validation", () => {
    test("rejects wholesale variant with bundle_size < 1", () => {
      const result = ProductCreateSchema.safeParse({
        title: "Test Wholesale Product",
        discountable: true,
        category_ids: ["cat_123"],
        globally_available: true,
        variants: [
          {
            should_create: true,
            title: "Pack",
            variant_rank: 0,
            variant_type: "wholesale",
            pack_description: "Bad Pack",
            bundle_size: 0,
          },
        ],
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const bundleSizeError = result.error.issues.find((issue) =>
          issue.path.some((p) => String(p).includes("bundle_size"))
        )
        expect(bundleSizeError).toBeDefined()
      }
    })

    test("accepts valid mix of retail and wholesale variants", () => {
      const result = ProductCreateSchema.safeParse({
        title: "Dual Market Product",
        discountable: true,
        category_ids: ["cat_123"],
        globally_available: true,
        variants: [
          {
            should_create: true,
            title: "Retail M",
            variant_rank: 0,
            variant_type: "retail",
            mrp: 30,
            options: { Size: "M" },
          },
          {
            should_create: true,
            title: "Wholesale Pack",
            variant_rank: 1,
            variant_type: "wholesale",
            pack_description: "Prepack 6x",
            bundle_size: 6,
            mrp: 150,
          },
        ],
      })

      if (!result.success) {
        console.error(result.error.issues)
      }
      expect(result.success).toBe(true)
    })
  })

  describe("normalizeVariants", () => {
    test("enriches variant metadata with variant_type, mrp, pack_description, and bundle_size", () => {
      const variants: ProductCreateSchemaType["variants"] = [
        {
          should_create: true,
          title: "Retail S",
          sku: "SKU-S",
          variant_rank: 0,
          variant_type: "retail",
          mrp: 25,
          options: { Size: "S" },
        },
        {
          should_create: true,
          title: "Pack A",
          sku: "SKU-PACK-A",
          variant_rank: 1,
          variant_type: "wholesale",
          pack_description: "Size Curve A",
          bundle_size: 12,
          mrp: 240,
        },
      ]

      const normalized = normalizeVariants(variants, false, {})
      expect(normalized).toHaveLength(2)

      expect(normalized[0].variant_type).toBe("retail")
      expect(normalized[0].mrp).toBe(25)
      expect(normalized[0].metadata).toEqual({
        variant_type: "retail",
        mrp: 25,
      })

      expect(normalized[1].variant_type).toBe("wholesale")
      expect(normalized[1].pack_description).toBe("Size Curve A")
      expect(normalized[1].bundle_size).toBe(12)
      expect(normalized[1].mrp).toBe(240)
      expect(normalized[1].metadata).toEqual({
        variant_type: "wholesale",
        pack_description: "Size Curve A",
        bundle_size: 12,
        mrp: 240,
      })
    })
  })

  describe("normalizeProductFormValues", () => {
    test("partitions form variants into retail_variants and wholesale_variants", () => {
      const formValues: any = {
        title: "Oxford Shirt",
        discountable: true,
        category_ids: ["cat_1"],
        globally_available: true,
        status: "published",
        regionsCurrencyMap: {},
        variants: [
          {
            should_create: true,
            title: "Oxford Shirt M",
            sku: "OXF-M",
            options: { Size: "M" },
            variant_rank: 0,
            variant_type: "retail",
            mrp: 50,
          },
          {
            should_create: true,
            title: "Oxford Shirt Solid Pack 6xM",
            sku: "OXF-6XM",
            variant_rank: 1,
            variant_type: "wholesale",
            pack_description: "Solid Pack 6xM",
            bundle_size: 6,
            mrp: 40,
          },
          {
            should_create: false,
            title: "Ignored Unchecked Variant",
            variant_rank: 2,
            variant_type: "retail",
          },
        ],
      }

      const payload: any = normalizeProductFormValues(formValues)

      expect(payload.variants).toBeUndefined()
      expect(payload.retail_variants).toHaveLength(1)
      expect(payload.wholesale_variants).toHaveLength(1)

      expect(payload.retail_variants[0]).toMatchObject({
        title: "Oxford Shirt M",
        sku: "OXF-M",
        mrp: 50,
        unit_msrp: 50,
        metadata: {
          variant_type: "retail",
          mrp: 50,
        },
      })

      expect(payload.wholesale_variants[0]).toMatchObject({
        title: "Oxford Shirt Solid Pack 6xM",
        sku: "OXF-6XM",
        pack_description: "Solid Pack 6xM",
        bundle_size: 6,
        mrp: 40,
        unit_msrp: 40,
        metadata: {
          variant_type: "wholesale",
          pack_description: "Solid Pack 6xM",
          bundle_size: 6,
          mrp: 40,
        },
      })
    })
  })
})
