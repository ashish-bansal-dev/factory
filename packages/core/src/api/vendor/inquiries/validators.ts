import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const VendorGetInquiriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
