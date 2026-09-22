import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { updateSellersWorkflow } from "../../../../../workflows/seller"

export interface DomainApprovalPayload {
  action: "approve_subdomain" | "reject_subdomain" | "configure_custom_domain"
  new_handle?: string
  custom_domain?: string
  custom_domain_verified?: boolean
  note?: string
}

export const POST = async (
  req: AuthenticatedMedusaRequest<DomainApprovalPayload>,
  res: MedusaResponse<HttpTypes.AdminSellerResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.params.id

  const {
    data: [existingSeller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "handle", "metadata"],
    filters: { id: sellerId },
  })

  if (!existingSeller) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Seller with id ${sellerId} was not found`
    )
  }

  const { action, new_handle, custom_domain, custom_domain_verified, note } = req.body || {}
  const currentMetadata = (existingSeller.metadata || {}) as Record<string, any>
  const domainSettings = currentMetadata.domain_settings || {}

  let updatedHandle = existingSeller.handle
  let updatedDomainSettings = { ...domainSettings }

  if (action === "approve_subdomain") {
    const requestedHandle = new_handle || domainSettings.subdomain_request?.requested_subdomain
    if (!requestedHandle) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No requested subdomain provided to approve"
      )
    }
    updatedHandle = requestedHandle
    updatedDomainSettings = {
      ...updatedDomainSettings,
      subdomain: requestedHandle,
      subdomain_request: {
        ...updatedDomainSettings.subdomain_request,
        status: "approved",
        approved_at: new Date().toISOString(),
      },
    }
  } else if (action === "reject_subdomain") {
    updatedDomainSettings = {
      ...updatedDomainSettings,
      subdomain_request: {
        ...updatedDomainSettings.subdomain_request,
        status: "rejected",
        rejection_note: note || "Rejected by admin",
        rejected_at: new Date().toISOString(),
      },
    }
  } else if (action === "configure_custom_domain") {
    updatedDomainSettings = {
      ...updatedDomainSettings,
      custom_domain: custom_domain ?? null,
      custom_domain_verified: custom_domain_verified ?? false,
    }
  }

  await updateSellersWorkflow(req.scope).run({
    input: {
      selector: { id: sellerId },
      update: {
        handle: updatedHandle,
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      },
    },
  })

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: req.queryConfig?.fields || ["id", "name", "handle", "metadata"],
    filters: { id: sellerId },
  })

  res.json({ seller } as unknown as HttpTypes.AdminSellerResponse)
}
