import { createInstantSearchAdapter } from "@medusajs/instantsearch-adapter"

export const PRODUCT_INDEX_NAME = "product"

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

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
