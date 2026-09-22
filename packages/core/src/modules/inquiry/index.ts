import { Module } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import InquiryModuleService from "./service"

export default Module(MercurModules.INQUIRY, {
  service: InquiryModuleService,
})
