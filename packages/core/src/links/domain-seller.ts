import { defineLink } from "@medusajs/framework/utils"
import SellerModule from "../modules/seller"
import DomainModule from "../modules/domain"

export default defineLink(SellerModule.linkable.seller, {
  linkable: DomainModule.linkable.domainMapping,
  isList: true,
})
