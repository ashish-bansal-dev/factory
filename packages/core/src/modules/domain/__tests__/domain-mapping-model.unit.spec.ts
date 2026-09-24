import { describe, expect, it } from "bun:test"
import DomainMapping from "../models/domain-mapping"
import { Migration20260924000000 } from "../migrations/Migration20260924000000"
import fs from "fs"
import path from "path"

describe("DomainMapping Model, Migration & Link Architecture (Milestone 1)", () => {
  const parsed = (DomainMapping as any).parse(DomainMapping.name)

  describe("DomainMapping Schema Properties", () => {
    it("defines id with prefix 'dom' as primary key", () => {
      const idProp = parsed.schema.id.parse("id")
      expect(idProp.fieldName).toBe("id")
      expect(idProp.primaryKey).toBe(true)
      expect(idProp.dataType.name).toBe("id")
      expect(idProp.dataType.options.prefix).toBe("dom")
    })

    it("defines seller_id as non-nullable text", () => {
      const sellerIdProp = parsed.schema.seller_id.parse("seller_id")
      expect(sellerIdProp.fieldName).toBe("seller_id")
      expect(sellerIdProp.dataType.name).toBe("text")
      expect(sellerIdProp.nullable).toBe(false)
    })

    it("defines domain as searchable non-nullable text", () => {
      const domainProp = parsed.schema.domain.parse("domain")
      expect(domainProp.fieldName).toBe("domain")
      expect(domainProp.dataType.name).toBe("text")
      expect(domainProp.nullable).toBe(false)
    })

    it("defines channel_type enum ('retail', 'wholesale') defaulting to 'retail'", () => {
      const channelProp = parsed.schema.channel_type.parse("channel_type")
      expect(channelProp.fieldName).toBe("channel_type")
      expect(channelProp.dataType.name).toBe("enum")
      expect(channelProp.dataType.options.choices).toEqual(["retail", "wholesale"])
      expect(channelProp.defaultValue).toBe("retail")
      expect(channelProp.nullable).toBe(false)
    })

    it("defines is_custom_domain boolean defaulting to false", () => {
      const customProp = parsed.schema.is_custom_domain.parse("is_custom_domain")
      expect(customProp.fieldName).toBe("is_custom_domain")
      expect(customProp.dataType.name).toBe("boolean")
      expect(customProp.defaultValue).toBe(false)
      expect(customProp.nullable).toBe(false)
    })

    it("defines verification_status enum ('pending', 'verified', 'failed') defaulting to 'pending'", () => {
      const statusProp = parsed.schema.verification_status.parse("verification_status")
      expect(statusProp.fieldName).toBe("verification_status")
      expect(statusProp.dataType.name).toBe("enum")
      expect(statusProp.dataType.options.choices).toEqual(["pending", "verified", "failed"])
      expect(statusProp.defaultValue).toBe("pending")
      expect(statusProp.nullable).toBe(false)
    })

    it("defines verification_token as nullable text", () => {
      const tokenProp = parsed.schema.verification_token.parse("verification_token")
      expect(tokenProp.fieldName).toBe("verification_token")
      expect(tokenProp.nullable).toBe(true)
    })

    it("defines verified_at as nullable dateTime", () => {
      const verifiedAtProp = parsed.schema.verified_at.parse("verified_at")
      expect(verifiedAtProp.fieldName).toBe("verified_at")
      expect(verifiedAtProp.nullable).toBe(true)
    })

    it("defines subscription_status enum ('active', 'inactive', 'trial') defaulting to 'active'", () => {
      const subProp = parsed.schema.subscription_status.parse("subscription_status")
      expect(subProp.fieldName).toBe("subscription_status")
      expect(subProp.dataType.name).toBe("enum")
      expect(subProp.dataType.options.choices).toEqual(["active", "inactive", "trial"])
      expect(subProp.defaultValue).toBe("active")
      expect(subProp.nullable).toBe(false)
    })

    it("defines branding_config as nullable json", () => {
      const brandingProp = parsed.schema.branding_config.parse("branding_config")
      expect(brandingProp.fieldName).toBe("branding_config")
      expect(brandingProp.nullable).toBe(true)
    })

    it("includes all 10 required fields from specification", () => {
      const expectedFields = [
        "id",
        "seller_id",
        "domain",
        "channel_type",
        "is_custom_domain",
        "verification_status",
        "verification_token",
        "verified_at",
        "subscription_status",
        "branding_config",
      ]
      for (const field of expectedFields) {
        expect(parsed.schema[field]).toBeDefined()
      }
    })
  })

  describe("DomainMapping Indexes", () => {
    it("defines unique B-tree index on domain with WHERE deleted_at IS NULL", () => {
      const domainIndex = parsed.indexes.find(
        (idx: any) => idx.name === "IDX_domain_mapping_domain_unique"
      )
      expect(domainIndex).toBeDefined()
      expect(domainIndex.unique).toBe(true)
      expect(domainIndex.on).toEqual(["domain"])
      expect(domainIndex.where).toBe("deleted_at IS NULL")
    })

    it("defines secondary indexes on seller_id and channel_type", () => {
      const sellerIdIndex = parsed.indexes.find(
        (idx: any) => idx.name === "IDX_domain_mapping_seller_id"
      )
      expect(sellerIdIndex).toBeDefined()
      expect(sellerIdIndex.on).toEqual(["seller_id"])
      expect(sellerIdIndex.where).toBe("deleted_at IS NULL")

      const channelIndex = parsed.indexes.find(
        (idx: any) => idx.name === "IDX_domain_mapping_channel_type"
      )
      expect(channelIndex).toBeDefined()
      expect(channelIndex.on).toEqual(["channel_type"])
      expect(channelIndex.where).toBe("deleted_at IS NULL")
    })
  })

  describe("MikroORM Migration DDL Verification", () => {
    it("Migration20260924000000 creates domain_mapping table with unique index and constraints", async () => {
      const executedSql: string[] = []
      const fakeDriver = { execute: async () => {} }
      const migration = new Migration20260924000000(fakeDriver as any, {} as any)
      migration.addSql = ((sql: string) => {
        executedSql.push(sql)
      }) as any

      await migration.up()

      // 1. Verify table creation
      const createTableSql = executedSql.find((s) => s.includes('create table if not exists "domain_mapping"'))
      expect(createTableSql).toBeDefined()
      expect(createTableSql).toContain('"id" text not null')
      expect(createTableSql).toContain('"seller_id" text not null')
      expect(createTableSql).toContain('"domain" text not null')
      expect(createTableSql).toContain('"channel_type" text not null default \'retail\'')
      expect(createTableSql).toContain('"is_custom_domain" boolean not null default false')
      expect(createTableSql).toContain('"verification_status" text not null default \'pending\'')
      expect(createTableSql).toContain('"verification_token" text null')
      expect(createTableSql).toContain('"verified_at" timestamptz null')
      expect(createTableSql).toContain('"subscription_status" text not null default \'active\'')
      expect(createTableSql).toContain('"branding_config" jsonb null')
      expect(createTableSql).toContain('constraint "domain_mapping_pkey" primary key ("id")')

      // 2. Verify unique index
      const uniqueIndexSql = executedSql.find((s) =>
        s.includes('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_domain_mapping_domain_unique"')
      )
      expect(uniqueIndexSql).toBeDefined()
      expect(uniqueIndexSql).toContain('ON "domain_mapping" ("domain")')
      expect(uniqueIndexSql).toContain("WHERE deleted_at IS NULL")

      // 3. Verify down migration drops table with cascade
      const downSql: string[] = []
      migration.addSql = ((sql: string) => {
        downSql.push(sql)
      }) as any
      await migration.down()

      const dropTableSql = downSql.find((s) => s.includes('drop table if exists "domain_mapping" cascade'))
      expect(dropTableSql).toBeDefined()
    })
  })

  describe("Cross-Module Link Definition", () => {
    it("defines link between SellerModule.seller and DomainModule.domainMapping with isList=true", () => {
      const linkFilePath = path.resolve(__dirname, "../../../links/domain-seller.ts")
      expect(fs.existsSync(linkFilePath)).toBe(true)
      const content = fs.readFileSync(linkFilePath, "utf-8")
      expect(content).toContain("defineLink(SellerModule.linkable.seller")
      expect(content).toContain("linkable: DomainModule.linkable.domainMapping")
      expect(content).toContain("isList: true")
    })
  })
})
