import {
  CartItemsFooter,
  CartItemsHeader,
  CartItemsProducts,
} from "@/components/cells"
import { CartSeller } from "@/components/cells/CartItemsHeader/CartItemsHeader"
import { HttpTypes } from "@medusajs/types"
import { EmptyCart } from "./EmptyCart"
import { Cart } from "@/types/cart"
import { SellerDTO } from "@mercurjs/types"

type CartItemGroup = {
  seller: Partial<SellerDTO> & { name?: string; photo?: string | null; id?: string }
  items: HttpTypes.StoreCartLineItem[]
}

type StoreCartItemWithOffer = HttpTypes.StoreCartLineItem & {
  offer?: {
    seller?: SellerDTO
  }
}

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | Cart | null }) => {
  if (!cart) return null

  const groupedItems = groupItemsBySeller(cart)

  if (!Object.keys(groupedItems).length) return <EmptyCart />

  return Object.keys(groupedItems).map((key) => (
    <div key={key} className="mb-4" data-testid={`cart-items-seller-${key}`}>
      <CartItemsHeader seller={groupedItems[key]?.seller as unknown as CartSeller} />
      <CartItemsProducts
        products={groupedItems[key].items || []}
        currency_code={cart.currency_code}
      />
      <CartItemsFooter
        currency_code={cart.currency_code}
        price={cart.shipping_subtotal}
      />
    </div>
  ))
}

function groupItemsBySeller(cart: HttpTypes.StoreCart | Cart): Record<string, CartItemGroup> {
  const groupedBySeller: Record<string, CartItemGroup> = {}

  cart.items?.forEach((item) => {
    const itemWithOffer = item as StoreCartItemWithOffer
    const seller = itemWithOffer.offer?.seller
    if (seller) {
      if (!groupedBySeller[seller.id]) {
        groupedBySeller[seller.id] = {
          seller: { ...seller, photo: seller.logo ?? null },
          items: [],
        }
      }
      groupedBySeller[seller.id].items.push(item)
    } else {
      if (!groupedBySeller["fleek"]) {
        groupedBySeller["fleek"] = {
          seller: {
            name: "Fleek",
            id: "fleek",
            photo: "/Logo.svg",
            created_at: new Date(),
          },
          items: [],
        }
      }
      groupedBySeller["fleek"].items.push(item)
    }
  })

  return groupedBySeller
}
