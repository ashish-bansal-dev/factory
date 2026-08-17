import { model } from "@medusajs/framework/utils"
import { BrandStatus } from "@mercurjs/types"

const Brand = model.define("Brand", {
  id: model.id({ prefix: "brand" }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().searchable().unique(),
  description: model.text().nullable(),
  logo: model.text().nullable(),
  banner: model.text().nullable(),
  website_url: model.text().nullable(),
  status: model.enum(BrandStatus).default(BrandStatus.PENDING_APPROVAL),
  metadata: model.json().nullable(),
})

export default Brand
