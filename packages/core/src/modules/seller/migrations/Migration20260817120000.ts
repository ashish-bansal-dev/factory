import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260817120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" add column if not exists "type" text check ("type" in ('manufacturer', 'distributor', 'wholesaler')) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop column if exists "type";`);
  }
}
