import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FactoryTribeSeal from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const { collections } = await listCollections({
    fields: "*products",
  }).catch(() => ({ collections: [] }))
  const productCategories = await listCategories().catch(() => [])

  return (
    <footer className="border-t border-stone-200 bg-sand-50/70 w-full font-sans">
      <div className="content-container flex flex-col w-full py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-stone-200">
          {/* Brand Col */}
          <div className="flex flex-col gap-3">
            <LocalizedClientLink
              href="/"
              className="font-serif text-2xl font-bold tracking-tight text-charcoal-900"
            >
              FactoryTribe
            </LocalizedClientLink>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
              The premier B2B wholesale marketplace connecting verified Indian apparel manufacturers, textile mills, and independent brands with retail boutiques nationwide.
            </p>
            <div className="text-xs text-stone-500 mt-2 space-y-1">
              <div>GST Registered B2B Wholesale Platform</div>
              <div>Pan-India Logistics & Net 60 Financing</div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-serif text-sm font-bold text-charcoal-900 mb-3 uppercase tracking-wider">
              Wholesale Categories
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-stone-600">
              {productCategories?.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink
                    className="hover:text-terracotta-600 transition"
                    href={`/categories/${c.handle}`}
                  >
                    {c.name}
                  </LocalizedClientLink>
                </li>
              ))}
              {(!productCategories || productCategories.length === 0) && (
                <>
                  <li><LocalizedClientLink href="/store" className="hover:text-terracotta-600">Ethnic & Festive Wear</LocalizedClientLink></li>
                  <li><LocalizedClientLink href="/store" className="hover:text-terracotta-600">Contemporary Western</LocalizedClientLink></li>
                  <li><LocalizedClientLink href="/store" className="hover:text-terracotta-600">Fabrics & Textiles</LocalizedClientLink></li>
                  <li><LocalizedClientLink href="/store" className="hover:text-terracotta-600">Accessories & Footwear</LocalizedClientLink></li>
                </>
              )}
            </ul>
          </div>

          {/* Collections & Sourcing */}
          <div>
            <h4 className="font-serif text-sm font-bold text-charcoal-900 mb-3 uppercase tracking-wider">
              Sourcing Hubs
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-stone-600">
              <li>
                <LocalizedClientLink href="/brands" className="hover:text-terracotta-600 transition">
                  Verified Brands & Labels
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/sellers" className="hover:text-terracotta-600 transition">
                  Direct Apparel Mills & Factories
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/store" className="hover:text-terracotta-600 transition">
                  High Margin Deals (60%+ Margin)
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink href="/store" className="hover:text-terracotta-600 transition">
                  Low MOQ Packs (Under ₹10,000)
                </LocalizedClientLink>
              </li>
            </ul>
          </div>

          {/* B2B Services & Portal */}
          <div>
            <h4 className="font-serif text-sm font-bold text-charcoal-900 mb-3 uppercase tracking-wider">
              Wholesale Services
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-stone-600">
              <li>
                <LocalizedClientLink href="/account" className="hover:text-terracotta-600 transition">
                  Retailer Account & Net 60 Terms
                </LocalizedClientLink>
              </li>
              <li>
                <a
                  href="https://vendor.factorytribe.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-terracotta-600 transition"
                >
                  Supplier & Factory Onboarding
                </a>
              </li>
              <li>
                <LocalizedClientLink href="/cart" className="hover:text-terracotta-600 transition">
                  Quote Basket & Inquiries
                </LocalizedClientLink>
              </li>
              <li>
                <span className="text-stone-500">WhatsApp Support: +91 99999 99999</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-stone-500">
          <div>
            © {new Date().getFullYear()} FactoryTribe. All rights reserved.
          </div>
          <FactoryTribeSeal />
        </div>
      </div>
    </footer>
  )
}
