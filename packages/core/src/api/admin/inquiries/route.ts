import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { MercurModules } from "@mercurjs/types"
import InquiryModuleService from "../../../modules/inquiry/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const inquiryService = req.scope.resolve<InquiryModuleService>(MercurModules.INQUIRY)

  const [inquiries, count] = await inquiryService.listAndCountWholesaleInquiries(
    {},
    {
      skip: req.queryConfig?.pagination?.skip ?? 0,
      take: req.queryConfig?.pagination?.take ?? 50,
      order: { created_at: "DESC" },
    }
  )

  res.json({
    inquiries,
    count,
    offset: req.queryConfig?.pagination?.skip ?? 0,
    limit: req.queryConfig?.pagination?.take ?? 50,
  })
}
