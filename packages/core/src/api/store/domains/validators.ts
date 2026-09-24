import { z } from "zod"

export const StoreGetDomainResolveParams = z.object({
  hostname: z.string().min(1, "hostname parameter is required"),
})

export type StoreGetDomainResolveParamsType = z.infer<
  typeof StoreGetDomainResolveParams
>
