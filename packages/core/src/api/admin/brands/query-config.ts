export const defaultAdminBrandFields = [
  "id",
  "name",
  "handle",
  "description",
  "logo",
  "banner",
  "website_url",
  "status",
  "metadata",
  "created_at",
  "updated_at",
  "*sellers",
]

export const adminBrandQueryConfig = {
  list: {
    defaults: defaultAdminBrandFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultAdminBrandFields,
    isList: false,
  },
}
