import { model } from "@medusajs/framework/utils"

const WholesaleInquiry = model.define("wholesale_inquiry", {
  id: model.id({ prefix: "inq" }).primaryKey(),
  store_name: model.text(),
  contact_number: model.text(),
  location: model.text(),
  product_id: model.text(),
  variant_id: model.text().nullable(),
  seller_id: model.text().nullable(),
  source_domain: model.text().nullable(),
  channel: model.text().default("whatsapp"),
  status: model.text().default("new"),
  metadata: model.json().nullable(),
})

export default WholesaleInquiry
