import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Repair migration for installations where an earlier Offer migration was
 * recorded but the legacy table was not altered. Every statement is
 * idempotent so this is safe to run against partially migrated databases.
 */
export class Migration20260924120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" ADD COLUMN IF NOT EXISTS "offer_type" text NOT NULL DEFAULT 'retail';`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" ADD COLUMN IF NOT EXISTS "bundle_size" integer NOT NULL DEFAULT 1;`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" ADD COLUMN IF NOT EXISTS "mrp" numeric NULL;`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" ADD COLUMN IF NOT EXISTS "raw_mrp" jsonb NULL;`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" ADD COLUMN IF NOT EXISTS "lead_time_days" integer NULL;`,
    )

    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_seller_sku_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_seller_sku_unique" ON "offer" ("seller_id", "sku", "offer_type") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_offer_offer_type" ON "offer" ("offer_type") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_offer_type";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_offer_seller_sku_unique";`)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_seller_sku_unique" ON "offer" ("seller_id", "sku") WHERE deleted_at IS NULL;`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" DROP COLUMN IF EXISTS "lead_time_days";`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" DROP COLUMN IF EXISTS "raw_mrp";`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" DROP COLUMN IF EXISTS "mrp";`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" DROP COLUMN IF EXISTS "bundle_size";`,
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "offer" DROP COLUMN IF EXISTS "offer_type";`,
    )
  }
}
