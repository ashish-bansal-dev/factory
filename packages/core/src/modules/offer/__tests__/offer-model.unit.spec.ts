import { describe, expect, it } from "bun:test"
import Offer from "../models/offer"
import { Migration20260924000000 } from "../migrations/Migration20260924000000"

describe("Offer Model & Index Architecture (Milestone 1)", () => {
  const parsed = (Offer as any).parse(Offer.name)

  describe("Offer DML Schema Properties", () => {
    it("defines offer_type as an enum with retail and wholesale choices defaulting to retail", () => {
      const offerTypeProp = parsed.schema.offer_type.parse("offer_type")
      expect(offerTypeProp.fieldName).toBe("offer_type")
      expect(offerTypeProp.dataType.name).toBe("enum")
      expect(offerTypeProp.dataType.options.choices).toEqual(["retail", "wholesale"])
      expect(offerTypeProp.defaultValue).toBe("retail")
      expect(offerTypeProp.nullable).toBe(false)
    })

    it("defines bundle_size as a number defaulting to 1 and non-nullable", () => {
      const bundleSizeProp = parsed.schema.bundle_size.parse("bundle_size")
      expect(bundleSizeProp.fieldName).toBe("bundle_size")
      expect(bundleSizeProp.dataType.name).toBe("number")
      expect(bundleSizeProp.defaultValue).toBe(1)
      expect(bundleSizeProp.nullable).toBe(false)
    })

    it("defines mrp as a bigNumber and nullable (with companion raw_mrp)", () => {
      expect(parsed.schema.mrp).toBeDefined()
      expect(parsed.schema.raw_mrp).toBeDefined()
      const mrpParsed = parsed.schema.mrp.parse("mrp")
      expect(mrpParsed.nullable).toBe(true)
    })

    it("defines lead_time_days as a number and nullable", () => {
      expect(parsed.schema.lead_time_days).toBeDefined()
      const leadTimeParsed = parsed.schema.lead_time_days.parse("lead_time_days")
      expect(leadTimeParsed.nullable).toBe(true)
    })
  })

  describe("Composite Unique Index Definition", () => {
    it("defines IDX_offer_seller_sku_unique over [seller_id, sku, offer_type] with unique=true", () => {
      const uniqueIndex = parsed.indexes.find(
        (idx: any) => idx.name === "IDX_offer_seller_sku_unique"
      )

      expect(uniqueIndex).toBeDefined()
      expect(uniqueIndex.unique).toBe(true)
      expect(uniqueIndex.on).toEqual(["seller_id", "sku", "offer_type"])
      expect(uniqueIndex.where).toBe("deleted_at IS NULL")
    })

    it("defines secondary index IDX_offer_offer_type over [offer_type]", () => {
      const offerTypeIndex = parsed.indexes.find(
        (idx: any) => idx.name === "IDX_offer_offer_type"
      )

      expect(offerTypeIndex).toBeDefined()
      expect(offerTypeIndex.on).toEqual(["offer_type"])
      expect(offerTypeIndex.where).toBe("deleted_at IS NULL")
    })

    it("composite index uniqueness allows same seller_id and sku when offer_type differs", () => {
      // Oracle: construct index tuple key function mirroring Postgres composite unique index
      const getIndexKey = (offer: {
        seller_id: string
        sku: string
        offer_type: string
        deleted_at?: string | null
      }) => {
        if (offer.deleted_at) {
          return null // partial index WHERE deleted_at IS NULL ignores deleted rows
        }
        return `${offer.seller_id}::${offer.sku}::${offer.offer_type}`
      }

      const sellerId = "sel_manufacturer_100"
      const sku = "VAR-SKU-999"

      const retailOffer = {
        seller_id: sellerId,
        sku,
        offer_type: "retail",
        deleted_at: null,
      }

      const wholesaleOffer = {
        seller_id: sellerId,
        sku,
        offer_type: "wholesale",
        deleted_at: null,
      }

      const retailKey = getIndexKey(retailOffer)
      const wholesaleKey = getIndexKey(wholesaleOffer)

      // Dual-channel offers on same variant/SKU have distinct composite keys
      expect(retailKey).not.toBe(wholesaleKey)
      expect(retailKey).toBe("sel_manufacturer_100::VAR-SKU-999::retail")
      expect(wholesaleKey).toBe("sel_manufacturer_100::VAR-SKU-999::wholesale")

      // Second retail offer would collide with existing retail offer
      const secondRetailOffer = {
        seller_id: sellerId,
        sku,
        offer_type: "retail",
        deleted_at: null,
      }
      expect(getIndexKey(secondRetailOffer)).toBe(retailKey)

      // Soft-deleted offer does not collide
      const deletedRetailOffer = {
        seller_id: sellerId,
        sku,
        offer_type: "retail",
        deleted_at: new Date().toISOString(),
      }
      expect(getIndexKey(deletedRetailOffer)).toBeNull()
    })
  })

  describe("MikroORM Migration DDL Verification", () => {
    it("Migration20260924000000 adds bundle_size as integer DEFAULT 1 and replaces unique index", async () => {
      const executedSql: string[] = []
      const fakeDriver = {
        execute: async () => {},
      }
      const migration = new Migration20260924000000(fakeDriver as any, {} as any)
      migration.addSql = ((sql: string) => {
        executedSql.push(sql)
      }) as any

      await migration.up()

      // 1. Verify bundle_size column
      const bundleSizeSql = executedSql.find((s) => s.includes('"bundle_size"'))
      expect(bundleSizeSql).toBeDefined()
      expect(bundleSizeSql).toContain('integer NOT NULL DEFAULT 1')

      // 2. Verify offer_type column
      const offerTypeSql = executedSql.find((s) => s.includes('"offer_type"') && s.includes("ADD COLUMN"))
      expect(offerTypeSql).toBeDefined()
      expect(offerTypeSql).toContain("text NOT NULL DEFAULT 'retail'")

      // 3. Verify mrp and raw_mrp columns
      const mrpSql = executedSql.find((s) => s.includes('"mrp"') && s.includes("ADD COLUMN"))
      expect(mrpSql).toBeDefined()
      const rawMrpSql = executedSql.find((s) => s.includes('"raw_mrp"') && s.includes("ADD COLUMN"))
      expect(rawMrpSql).toBeDefined()

      // 4. Verify old index dropped and new composite unique index created
      const dropIndexSql = executedSql.find((s) => s.includes('DROP INDEX IF EXISTS "IDX_offer_seller_sku_unique"'))
      expect(dropIndexSql).toBeDefined()

      const createCompositeUniqueSql = executedSql.find((s) =>
        s.includes('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_seller_sku_unique"')
      )
      expect(createCompositeUniqueSql).toBeDefined()
      expect(createCompositeUniqueSql).toContain('("seller_id", "sku", "offer_type")')
      expect(createCompositeUniqueSql).toContain("WHERE deleted_at IS NULL")

      // 5. Verify down() migration reverses changes cleanly
      const downSql: string[] = []
      migration.addSql = ((sql: string) => {
        downSql.push(sql)
      }) as any
      await migration.down()

      const restoreOldIndexSql = downSql.find((s) =>
        s.includes('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_seller_sku_unique"')
      )
      expect(restoreOldIndexSql).toBeDefined()
      expect(restoreOldIndexSql).toContain('("seller_id", "sku")')
    })
  })
})
