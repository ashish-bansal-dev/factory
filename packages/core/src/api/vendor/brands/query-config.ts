export const defaultVendorBrandFields = [
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
]

export const vendorBrandQueryConfig = {
  list: {
    defaults: defaultVendorBrandFields,
    isList: true,
  },
  retrieve: {
    defaults: defaultVendorBrandFields,
    isList: false,
  },
}
