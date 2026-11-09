import { createInstantSearchAdapter } from "@medusajs/instantsearch-adapter"

export const PRODUCT_INDEX_NAME = "product"

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  }
  if (process.env.MEDUSA_BACKEND_URL) {
    return process.env.MEDUSA_BACKEND_URL
  }
  return "http://localhost:9000"
}

const baseUrl = getBaseUrl()

const publishableApiKey =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const { searchClient } = createInstantSearchAdapter({
  baseUrl,
  path: "/store/search",
  publishableApiKey,
  placeholderSearch: false,
  additionalSearchParameters: {
    search_options: {
      match_strategy: "last",
    },
  },
})
