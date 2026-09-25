import { z } from "zod"

export type VendorUploadPreSignedUrlType = z.infer<typeof VendorUploadPreSignedUrl>
export const VendorUploadPreSignedUrl = z.object({
  originalname: z.string(),
  mime_type: z.string(),
  size: z.number(),
  access: z.enum(["public", "private"]).default("public").optional(),
})
