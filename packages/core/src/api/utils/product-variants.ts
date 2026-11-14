export function transformProductVariants<
  T extends {
    variants?: any[]
    retail_variants?: any[]
    wholesale_variants?: any[]
  }
>(productData: T): T {
  const transformed: any[] = []

  if (Array.isArray(productData.retail_variants)) {
    for (const rv of productData.retail_variants) {
      const {
        mrp,
        unit_msrp,
        additional_data,
        ...rest
      } = rv

      const metadata: Record<string, unknown> = {
        ...(rest.metadata || {}),
        variant_type: "retail",
      }
      if (mrp !== undefined && mrp !== null) {
        metadata.mrp = mrp
      }
      if (unit_msrp !== undefined && unit_msrp !== null) {
        metadata.unit_msrp = unit_msrp
      }

      const title =
        rest.title ||
        (rest.options ? Object.values(rest.options).join(" / ") : "Retail Variant")

      transformed.push({
        ...rest,
        title,
        metadata,
      })
    }
    delete productData.retail_variants
  }

  if (Array.isArray(productData.wholesale_variants)) {
    for (const wv of productData.wholesale_variants) {
      const {
        pack_description,
        pack_name,
        bundle_size,
        pack_breakdown,
        mrp,
        unit_msrp,
        additional_data,
        ...rest
      } = wv

      const packDesc = pack_description ?? pack_name
      const metadata: Record<string, unknown> = {
        ...(rest.metadata || {}),
        variant_type: "wholesale",
        bundle_size,
      }
      if (packDesc !== undefined && packDesc !== null) {
        metadata.pack_description = packDesc
      }
      if (pack_breakdown !== undefined && pack_breakdown !== null) {
        metadata.pack_breakdown = pack_breakdown
      }
      if (mrp !== undefined && mrp !== null) {
        metadata.mrp = mrp
      }
      if (unit_msrp !== undefined && unit_msrp !== null) {
        metadata.unit_msrp = unit_msrp
      }

      const title = rest.title || packDesc || "Wholesale Pack"

      transformed.push({
        ...rest,
        title,
        metadata,
      })
    }
    delete productData.wholesale_variants
  }

  if (transformed.length > 0) {
    productData.variants = [
      ...(productData.variants || []),
      ...transformed,
    ]
  }

  return productData
}

export function categorizeProductVariants<
  T extends {
    variants?: any[]
    retail_variants?: any[]
    wholesale_variants?: any[]
  }
>(product: T): T {
  if (!product || !Array.isArray(product.variants)) {
    return product
  }

  const retailVariants: any[] = []
  const wholesaleVariants: any[] = []

  for (const variant of product.variants) {
    const metadata = variant.metadata || {}
    const variantType = metadata.variant_type

    if (variantType === "wholesale") {
      const packDesc = metadata.pack_description ?? metadata.pack_name
      if (packDesc && !variant.pack_description) {
        variant.pack_description = packDesc
      }
      if (packDesc && !variant.pack_name) {
        variant.pack_name = packDesc
      }
      if (metadata.bundle_size !== undefined && variant.bundle_size === undefined) {
        variant.bundle_size = metadata.bundle_size
      }
      if (metadata.pack_breakdown && !variant.pack_breakdown) {
        variant.pack_breakdown = metadata.pack_breakdown
      }
      if (metadata.mrp !== undefined && variant.mrp === undefined) {
        variant.mrp = metadata.mrp
      }
      if (metadata.unit_msrp !== undefined && variant.unit_msrp === undefined) {
        variant.unit_msrp = metadata.unit_msrp
      }
      wholesaleVariants.push(variant)
    } else {
      if (metadata.mrp !== undefined && variant.mrp === undefined) {
        variant.mrp = metadata.mrp
      }
      if (metadata.unit_msrp !== undefined && variant.unit_msrp === undefined) {
        variant.unit_msrp = metadata.unit_msrp
      }
      retailVariants.push(variant)
    }
  }

  product.retail_variants = retailVariants
  product.wholesale_variants = wholesaleVariants

  return product
}

export function categorizeProductsVariants<
  T extends {
    variants?: any[]
    retail_variants?: any[]
    wholesale_variants?: any[]
  }
>(products: T[]): T[] {
  if (Array.isArray(products)) {
    for (const product of products) {
      categorizeProductVariants(product)
    }
  }
  return products
}
