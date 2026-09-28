import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"
import BrandModule from "../modules/brand"

export default defineLink(
  BrandModule.linkable.brand,
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  }
)
