import { MedusaService } from "@medusajs/framework/utils"
import { WholesaleInquiry } from "./models"

class InquiryModuleService extends MedusaService({
  WholesaleInquiry,
}) {}

export default InquiryModuleService
