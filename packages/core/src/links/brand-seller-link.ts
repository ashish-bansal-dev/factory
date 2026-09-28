import { defineLink } from "@medusajs/framework/utils"
import BrandModule from "../modules/brand"
import SellerModule from "../modules/seller"

export default defineLink(
  {
    linkable: BrandModule.linkable.brand,
    isList: true,
  },
  {
    linkable: SellerModule.linkable.seller,
    isList: true,
  }
)
