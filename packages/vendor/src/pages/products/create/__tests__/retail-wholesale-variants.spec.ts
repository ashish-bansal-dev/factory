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

describe("Retail & Wholesale Product Variants in Vendor Create Form", () => {
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

      expect(result.success).toBe(true)
    })
  })

  describe("normalizeVariants & normalizeProductFormValues", () => {
    test("enriches variant metadata with variant_type, mrp, pack_description, and bundle_size", () => {
      const variants: ProductCreateSchemaType["variants"] = [
        {
          should_create: true,
          title: "Retail S",
          sku: "RET-S",
          variant_rank: 0,
          variant_type: "retail",
          mrp: 25,
          options: { Size: "S" },
        },
        {
          should_create: true,
          title: "Pack 12",
          sku: "WHOLE-12",
          variant_rank: 1,
          variant_type: "wholesale",
          pack_description: "Pack of 12",
          bundle_size: 12,
          mrp: 240,
        },
      ]

      const normalized = normalizeVariants(variants, false)

      expect(normalized[0].variant_type).toBe("retail")
      expect(normalized[0].bundle_size).toBe(1)
      expect(normalized[0].mrp).toBe(25)
      expect(normalized[0].metadata).toEqual({
        variant_type: "retail",
        mrp: 25,
      })

      expect(normalized[1].variant_type).toBe("wholesale")
      expect(normalized[1].bundle_size).toBe(12)
      expect(normalized[1].pack_description).toBe("Pack of 12")
      expect(normalized[1].mrp).toBe(240)
      expect(normalized[1].metadata).toEqual({
        variant_type: "wholesale",
        pack_description: "Pack of 12",
        bundle_size: 12,
        mrp: 240,
      })
    })

    test("splits retail and wholesale variants into retail_variants and wholesale_variants payloads", () => {
      const formValues: ProductCreateSchemaType = {
        title: "Dual Purpose Shirt",
        discountable: true,
        category_ids: ["cat_123"],
        variants: [
          {
            should_create: true,
            title: "Single Shirt",
            sku: "SHIRT-1",
            variant_rank: 0,
            variant_type: "retail",
            mrp: 40,
          },
          {
            should_create: true,
            title: "Pack of 6",
            sku: "SHIRT-6",
            variant_rank: 1,
            variant_type: "wholesale",
            pack_description: "Pack 6 Shirts",
            bundle_size: 6,
            mrp: 200,
          },
          {
            should_create: false,
            title: "Skipped",
            variant_rank: 2,
            variant_type: "retail",
          },
        ],
      }

      const payload = normalizeProductFormValues(formValues as any) as any

      expect(payload.variants).toBeUndefined()
      expect(payload.retail_variants).toHaveLength(1)
      expect(payload.retail_variants[0].title).toBe("Single Shirt")
      expect(payload.retail_variants[0].sku).toBe("SHIRT-1")
      expect(payload.retail_variants[0].mrp).toBe(40)

      expect(payload.wholesale_variants).toHaveLength(1)
      expect(payload.wholesale_variants[0].title).toBe("Pack of 6")
      expect(payload.wholesale_variants[0].sku).toBe("SHIRT-6")
      expect(payload.wholesale_variants[0].pack_description).toBe("Pack 6 Shirts")
      expect(payload.wholesale_variants[0].bundle_size).toBe(6)
      expect(payload.wholesale_variants[0].mrp).toBe(200)
    })
  })
})
