import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const AdminGetInquiriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
