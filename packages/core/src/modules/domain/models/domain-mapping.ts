import { model } from "@medusajs/framework/utils"

const DomainMapping = model
  .define("DomainMapping", {
    id: model.id({ prefix: "dom" }).primaryKey(),
    seller_id: model.text(),
    domain: model.text().searchable(),
    channel_type: model.enum(["retail", "wholesale"]).default("retail"),
    is_custom_domain: model.boolean().default(false),
    verification_status: model
      .enum(["pending", "verified", "failed"])
      .default("pending"),
    verification_token: model.text().nullable(),
    verified_at: model.dateTime().nullable(),
    subscription_status: model
      .enum(["active", "inactive", "trial"])
      .default("active"),
    branding_config: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_domain_mapping_domain_unique",
      on: ["domain"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_domain_mapping_seller_id",
      on: ["seller_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_domain_mapping_channel_type",
      on: ["channel_type"],
      where: "deleted_at IS NULL",
    },
  ])

export default DomainMapping
