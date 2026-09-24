import { MedusaService } from "@medusajs/framework/utils"
import { DomainMapping } from "./models"

class DomainModuleService extends MedusaService({
  DomainMapping,
}) {}

export default DomainModuleService
