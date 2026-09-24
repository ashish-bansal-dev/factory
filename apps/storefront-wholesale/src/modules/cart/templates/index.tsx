import CartContent from "./cart-content"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        <CartContent cart={cart} customer={customer} />
      </div>
    </div>
  )
}

export default CartTemplate
