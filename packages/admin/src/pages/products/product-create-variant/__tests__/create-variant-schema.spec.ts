import { describe, expect, test } from "vitest";
import { CreateProductVariantSchema } from "../components/create-product-variant-form/constants";

describe("Admin Variant Forms & Classification", () => {
  describe("CreateProductVariantSchema", () => {
    test("defaults variant_type, bundle_size, and pack_description for retail", () => {
      const parsed = CreateProductVariantSchema.parse({
        title: "Size L",
      });

      expect(parsed.variant_type).toBe("retail");
      expect(parsed.bundle_size).toBe(1);
      expect(parsed.pack_description).toBe("Single pc");
      expect(parsed.mrp).toBeUndefined();
    });

    test("accepts wholesale channel values and mrp", () => {
      const parsed = CreateProductVariantSchema.parse({
        title: "Wholesale Pack 6",
        variant_type: "wholesale",
        bundle_size: 6,
        pack_description: "Sizes 28-32, Pack of 6 (1-2-2-1)",
        mrp: 149.99,
      });

      expect(parsed.variant_type).toBe("wholesale");
      expect(parsed.bundle_size).toBe(6);
      expect(parsed.pack_description).toBe("Sizes 28-32, Pack of 6 (1-2-2-1)");
      expect(parsed.mrp).toBe(149.99);
    });

    test("coerces string numbers for bundle_size and mrp", () => {
      const parsed = CreateProductVariantSchema.parse({
        title: "Wholesale Pack",
        bundle_size: "12",
        mrp: "299",
      });

      expect(parsed.bundle_size).toBe(12);
      expect(parsed.mrp).toBe(299);
    });

    test("handles empty string for optional mrp and bundle_size during form editing", () => {
      const parsed = CreateProductVariantSchema.parse({
        title: "Variant",
        bundle_size: "",
        mrp: "",
      });

      expect(parsed.bundle_size).toBe("");
      // When mrp is empty or 0, mrp ? Number(mrp) : undefined yields undefined
      const submittedMrp = parsed.mrp ? Number(parsed.mrp) : undefined;
      expect(submittedMrp).toBeUndefined();
    });
  });

  describe("Watertight Variant Classification", () => {
    const isWholesale = (v: any) =>
      (v.metadata as any)?.variant_type === "wholesale" ||
      Number((v.metadata as any)?.bundle_size) > 1;
    const isRetail = (v: any) => !isWholesale(v);

    test("correctly classifies all variants such that All = Retail + Wholesale", () => {
      const sampleVariants = [
        { id: "v1", title: "Retail M", metadata: { variant_type: "retail", bundle_size: 1 } },
        { id: "v2", title: "Legacy Variant Without Metadata", metadata: undefined },
        { id: "v3", title: "Legacy Variant Empty Metadata", metadata: {} },
        { id: "v4", title: "Wholesale Variant by type", metadata: { variant_type: "wholesale" } },
        { id: "v5", title: "Wholesale Variant by bundle_size", metadata: { bundle_size: 6 } },
        { id: "v6", title: "Wholesale Variant string bundle_size", metadata: { bundle_size: "12" } },
        { id: "v7", title: "Retail with single bundle_size", metadata: { variant_type: "retail", bundle_size: "1" } },
      ];

      const retail = sampleVariants.filter(isRetail);
      const wholesale = sampleVariants.filter(isWholesale);

      expect(retail.length + wholesale.length).toBe(sampleVariants.length);
      expect(retail.map((v) => v.id)).toEqual(["v1", "v2", "v3", "v7"]);
      expect(wholesale.map((v) => v.id)).toEqual(["v4", "v5", "v6"]);
    });
  });
});
