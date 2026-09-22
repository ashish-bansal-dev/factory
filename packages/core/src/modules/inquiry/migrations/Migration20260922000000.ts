import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260922000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "wholesale_inquiry" (
        "id" text not null,
        "store_name" text not null,
        "contact_number" text not null,
        "location" text not null,
        "product_id" text not null,
        "variant_id" text null,
        "seller_id" text null,
        "source_domain" text null,
        "channel" text not null default 'whatsapp',
        "status" text not null default 'new',
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "wholesale_inquiry_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_wholesale_inquiry_seller_id" ON "wholesale_inquiry" ("seller_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_wholesale_inquiry_product_id" ON "wholesale_inquiry" ("product_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_wholesale_inquiry_deleted_at" ON "wholesale_inquiry" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wholesale_inquiry" cascade;`)
  }
}
