import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

export type LinkProductBrandStepInput =
  | {
      product_id: string
      brand_id: string
    }
  | {
      product_id: string
      brand_id: string
    }[]

export const linkProductBrandStepId = "link-product-brand"

export const linkProductBrandStep = createStep(
  linkProductBrandStepId,
  async (input: LinkProductBrandStepInput | undefined, { container }) => {
    const rawItems = Array.isArray(input) ? input : input ? [input] : []
    const items = rawItems.filter(
      (item): item is { product_id: string; brand_id: string } =>
        Boolean(item?.product_id && item?.brand_id)
    )

    if (!items.length) {
      return new StepResponse(undefined, null)
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = items.map((item) => ({
      [MercurModules.BRAND]: { brand_id: item.brand_id },
      [Modules.PRODUCT]: { product_id: item.product_id },
    }))

    await remoteLink.create(links)
    return new StepResponse(undefined, items)
  },
  async (items, { container }) => {
    if (!items?.length) {
      return
    }

    const remoteLink: Link = container.resolve(
      ContainerRegistrationKeys.LINK
    )

    const links = (items as { product_id: string; brand_id: string }[]).map((item) => ({
      [MercurModules.BRAND]: { brand_id: item.brand_id },
      [Modules.PRODUCT]: { product_id: item.product_id },
    }))

    await remoteLink.dismiss(links)
  }
)
