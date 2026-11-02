import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export const dynamic = "force-dynamic"

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  const defaultImages = product.images ?? []
  if (!selectedVariantId || !product.variants) {
    return defaultImages
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images?.length) {
    return defaultImages
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return defaultImages.filter((i) => imageIdsMap.has(i.id))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const region = await getRegion(params.countryCode).catch(() => null)

  if (!region) {
    return {
      title: "Product Not Found | FactoryTribe Wholesale",
    }
  }

  const product = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle },
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!product) {
    return {
      title: "Product Not Found | FactoryTribe Wholesale",
    }
  }

  return {
    title: `${product.title} | FactoryTribe Wholesale`,
    description: `${product.title} - Direct manufacturer wholesale packs and pricing on FactoryTribe.`,
    openGraph: {
      title: `${product.title} | FactoryTribe Wholesale`,
      description: `${product.title}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode).catch(() => null)
  const searchParams = await props.searchParams

  const selectedVariantId = searchParams.v_id

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  })
    .then(({ response }) => response.products[0])
    .catch(() => null)

  if (!pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  return (
    <ProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={params.countryCode}
      images={images}
    />
  )
}
