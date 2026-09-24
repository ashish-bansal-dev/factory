import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260924000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "domain_mapping" (
        "id" text not null,
        "seller_id" text not null,
        "domain" text not null,
        "channel_type" text not null default 'retail',
        "is_custom_domain" boolean not null default false,
        "verification_status" text not null default 'pending',
        "verification_token" text null,
        "verified_at" timestamptz null,
        "subscription_status" text not null default 'active',
        "branding_config" jsonb null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "domain_mapping_pkey" primary key ("id")
      );`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_domain_mapping_domain_unique" ON "domain_mapping" ("domain") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_domain_mapping_seller_id" ON "domain_mapping" ("seller_id") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_domain_mapping_channel_type" ON "domain_mapping" ("channel_type") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_domain_mapping_deleted_at" ON "domain_mapping" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "domain_mapping" cascade;`)
  }
}
