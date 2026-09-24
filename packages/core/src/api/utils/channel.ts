import { MedusaRequest } from "@medusajs/framework/http"

export type ChannelType = "retail" | "wholesale"

export function resolveChannel(
  req: MedusaRequest
): ChannelType | undefined {
  const headerChannel = req.headers?.["x-channel"]
  if (typeof headerChannel === "string") {
    const normalized = headerChannel.toLowerCase().trim()
    if (normalized === "retail" || normalized === "wholesale") {
      return normalized
    }
  }

  const query = (req as { query?: Record<string, unknown> }).query ?? {}
  const filterable = (req as { filterableFields?: Record<string, unknown> }).filterableFields ?? {}
  const queryChannel =
    query.channel || filterable.channel || query.offer_type || filterable.offer_type
  if (typeof queryChannel === "string") {
    const normalized = queryChannel.toLowerCase().trim()
    if (normalized === "retail" || normalized === "wholesale") {
      return normalized
    }
  }

  return undefined
}
