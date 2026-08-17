import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Link } from "@medusajs/framework/modules-sdk"
import { MercurModules } from "@mercurjs/types"

type LinkBrandSellersStepInput = {
  brand_id: string
  seller_ids: string[]
}

export const linkBrandSellersStep = createStep(
  "link-brand-sellers",
  async (input: LinkBrandSellersStepInput, { container }) => {
    if (!input.seller_ids?.length) {
      return new StepResponse(undefined, null)
    }

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = input.seller_ids.map((sellerId) => ({
      [MercurModules.BRAND]: {
        brand_id: input.brand_id,
      },
      [MercurModules.SELLER]: {
        seller_id: sellerId,
      },
    }))

    await remoteLink.create(links)

    return new StepResponse(undefined, input)
  },
  async (data, { container }) => {
    if (!data?.seller_ids?.length) return

    const remoteLink: Link = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

    const links = data.seller_ids.map((sellerId: string) => ({
      [MercurModules.BRAND]: {
        brand_id: data.brand_id,
      },
      [MercurModules.SELLER]: {
        seller_id: sellerId,
      },
    }))

    await remoteLink.dismiss(links)
  }
)
