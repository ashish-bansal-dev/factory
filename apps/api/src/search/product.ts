import {
  defineSearchIndex,
  graphConsume,
  graphSeed,
  search,
} from "@medusajs/framework/utils"

const productFields = search.define({
  id: search.keyword().filterable().retrievable(),
  status: search.keyword().filterable().retrievable(false),
  title: search.text().searchable({ weight: 3 }).sortable().retrievable(),
  description: search.text().searchable({ weight: 1 }).retrievable(),
  handle: search.keyword().retrievable(),
  thumbnail: search.keyword().retrievable(),
  created_at: search.date().sortable().retrievable(),
  seller_ids: search.keyword().array().filterable().facetable().retrievable(),
  categories: search
    .keyword()
    .array()
    .searchable({ weight: 2 })
    .filterable()
    .facetable()
    .retrievable(),
  labels: search
    .keyword()
    .array()
    .searchable({ weight: 2 })
    .filterable()
    .facetable()
    .retrievable(),
})

type ProductRecord = {
  id: string
  title: string
  description?: string | null
  handle: string
  thumbnail?: string | null
  status: string
  created_at: string | Date
  sales_channels?: { id: string }[]
  sellers?: { id: string }[]
  offers?: { seller_id?: string }[]
  categories?: { name: string }[]
  tags?: { value: string }[]
}

const source = {
  fields: [
    "id",
    "title",
    "description",
    "handle",
    "thumbnail",
    "status",
    "created_at",
    "sales_channels.id",
    "sellers.id",
    "offers.seller_id",
    "categories.name",
    "tags.value",
  ],
  transform: (products: ProductRecord[]) => {
    return products.map((product) => {
      const sellerIds = Array.from(
        new Set([
          ...(product.sellers ?? []).map((s) => s.id),
          ...(product.offers ?? []).map((o) => o.seller_id).filter(Boolean) as string[],
        ])
      )

      return {
        id: product.id,
        status: product.status,
        sales_channel_ids: (product.sales_channels ?? []).map(
          (sc) => sc.id
        ),
        title: product.title,
        description: product.description ?? "",
        handle: product.handle,
        thumbnail: product.thumbnail ?? null,
        created_at: product.created_at,
        seller_ids: sellerIds,
        categories: (product.categories ?? []).map(
          (cat) => cat.name
        ),
        labels: (product.tags ?? []).map(
          (tag) => tag.value
        ),
      }
    })
  },
}

export const productIndex = defineSearchIndex({
  name: "product",
  entity: "product",
  fields: productFields,
  settings: {
    typo_tolerance: { enabled: false },
  },
  events: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-tag.updated",
    "product-tag.deleted",
    "product-category.updated",
    "product-category.deleted",
    "sales-channel.deleted",
    "offer.created",
    "offer.updated",
    "offer.deleted",
  ],
  consume: graphConsume(source),
  seed: graphSeed(source),
})

export default productIndex
