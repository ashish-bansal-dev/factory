import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_type_check";`);
    this.addSql(`alter table if exists "seller" add constraint "seller_type_check" check ("type" in ('manufacturer', 'distributor', 'wholesaler', 'retailer'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "seller" drop constraint if exists "seller_type_check";`);
    this.addSql(`alter table if exists "seller" add constraint "seller_type_check" check ("type" in ('manufacturer', 'distributor', 'wholesaler'));`);
  }
}
