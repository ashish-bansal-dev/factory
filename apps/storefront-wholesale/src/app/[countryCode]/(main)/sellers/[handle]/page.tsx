import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSellerByHandle } from "@lib/data/seller"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await props.params
  const seller = await getSellerByHandle(handle)

  if (!seller) {
    return { title: "Supplier Not Found | FactoryTribe" }
  }

  return {
    title: `${seller.name} - Wholesale Showroom | FactoryTribe`,
    description: seller.description || `Browse wholesale products from verified supplier ${seller.name}.`,
  }
}

export default async function SellerProfilePage(props: {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { countryCode, handle } = await props.params
  const { page } = await props.searchParams

  const seller = await getSellerByHandle(handle)
  if (!seller) {
    notFound()
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const currentPage = page ? parseInt(page, 10) : 1
  const { response } = await listProducts({
    countryCode,
    pageParam: currentPage,
    queryParams: {
      seller_id: seller.id,
      limit: 24,
    },
  })

  const products = response.products
  const count = response.count

  const whatsappMsg = encodeURIComponent(
    `Hello! I would like to inquire about bulk wholesale orders and manufacturing terms from ${seller.name} on FactoryTribe Wholesale.`
  )
  const targetPhone = "919782077711"
  const whatsappUrl = `https://wa.me/${targetPhone}?text=${whatsappMsg}`

  return (
    <div className="content-container py-8 font-sans">
      {/* Seller Hero Card */}
      <div className="rounded-2xl border border-stone-200 overflow-hidden bg-white mb-10 shadow-sm">
        <div className="h-44 bg-sand-100 relative">
          {seller.banner && (
            <img
              src={seller.banner}
              alt={seller.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-x-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center font-serif font-bold text-2xl text-charcoal-900">
                {seller.logo ? (
                  <img
                    src={seller.logo}
                    alt={seller.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  seller.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-x-2.5 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900">
                    {seller.name}
                  </h1>
                  <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-700/20">
                    Verified Manufacturer
                  </span>
                </div>
                <span className="text-xs text-stone-500">
                  Official FactoryTribe Wholesale Partner
                </span>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 bg-charcoal-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition shadow-xs text-center flex items-center justify-center gap-2"
            >
              <span>Inquire for Bulk Order on WhatsApp &rarr;</span>
            </a>
          </div>

          {seller.description && (
            <div className="max-w-3xl mb-4">
              <p className="text-sm text-stone-600 leading-relaxed">
                {seller.description}
              </p>
            </div>
          )}

          <div className="flex items-center gap-x-6 text-xs text-stone-500 border-t border-stone-100 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-700 inline-block" />
              <span>GST Verified Manufacturer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600 inline-block" />
              <span>Net 60 Financing Eligible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Products Catalog */}
      <div className="mb-6 flex justify-between items-center border-b border-stone-200 pb-3">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal-900">
          Wholesale Catalog ({count})
        </h2>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-sand-50 rounded-2xl border border-stone-200 text-stone-500 text-sm">
          No products currently listed by this supplier.
        </div>
      ) : (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
