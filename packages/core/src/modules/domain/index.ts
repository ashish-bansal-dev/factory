import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"
import DomainModuleService from "./service"

export default Module(MercurModules.DOMAIN, {
  service: DomainModuleService,
})
