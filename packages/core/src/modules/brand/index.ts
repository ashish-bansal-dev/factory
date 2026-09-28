import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import BrandModuleService from "./service"

export default Module(MercurModules.BRAND, {
  service: BrandModuleService,
})
