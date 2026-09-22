import { Metadata } from "next"
import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Wholesale Categories Directory",
  description: "Browse wholesale products by categories, departments, and apparel lines.",
}

export default async function CategoriesPage() {
  const categories = await listCategories().catch(() => [])

  // Filter top-level categories (those without parent_category)
  const rootCategories = (categories || []).filter((c) => !c.parent_category)

  return (
    <div className="content-container py-12">
      <div className="flex flex-col gap-y-2 mb-8">
        <span className="text-xs uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded w-fit">
          Wholesale Catalog Discovery
        </span>
        <Heading level="h1" className="text-3xl font-semibold text-ui-fg-base">
          Browse by Category
        </Heading>
        <Text className="text-ui-fg-subtle text-base">
          Explore bulk merchandise across all wholesale departments, product types, and collections.
        </Text>
      </div>

      {rootCategories.length === 0 ? (
        <div className="text-center py-16 bg-ui-bg-subtle rounded-xl">
          <Text className="text-ui-fg-muted">
            No categories available at the moment.
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {rootCategories.map((category) => {
            const children = category.category_children || []

            return (
              <div
                key={category.id}
                className="border border-ui-border-base rounded-2xl p-6 bg-ui-bg-base hover:border-ui-fg-interactive transition flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-ui-bg-subtle flex items-center justify-center mb-4 text-emerald-700 font-bold text-lg">
                    {category.name.slice(0, 1).toUpperCase()}
                  </div>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="group"
                  >
                    <Heading
                      level="h3"
                      className="text-lg font-semibold group-hover:text-ui-fg-interactive transition"
                    >
                      {category.name}
                    </Heading>
                  </LocalizedClientLink>

                  {category.description && (
                    <Text className="text-xs text-ui-fg-subtle line-clamp-2 mt-1">
                      {category.description}
                    </Text>
                  )}

                  {/* Subcategories */}
                  {children.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-ui-border-subtle">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-ui-fg-muted block mb-2">
                        Subcategories
                      </span>
                      <ul className="flex flex-wrap gap-1.5">
                        {children.slice(0, 5).map((child) => (
                          <li key={child.id}>
                            <LocalizedClientLink
                              href={`/categories/${child.handle}`}
                              className="text-xs px-2 py-0.5 rounded bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover text-ui-fg-subtle transition"
                            >
                              {child.name}
                            </LocalizedClientLink>
                          </li>
                        ))}
                        {children.length > 5 && (
                          <li>
                            <LocalizedClientLink
                              href={`/categories/${category.handle}`}
                              className="text-xs px-2 py-0.5 text-ui-fg-muted hover:underline"
                            >
                              +{children.length - 5} more
                            </LocalizedClientLink>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-ui-border-subtle">
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                  >
                    View Products in {category.name} →
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
