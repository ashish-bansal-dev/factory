"use server"

import { headers as nextHeaders } from "next/headers"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export interface WholesaleInquiryInput {
  store_name: string
  contact_number: string
  location: string
  product_id: string
  variant_id?: string | null
  seller_id?: string | null
  source_domain?: string | null
  notes?: string | null
  quantity?: number | null
  batch_id?: string | null
  metadata?: Record<string, unknown> | null
}

export interface WholesaleInquiryResponse {
  inquiry: {
    id: string
    store_name: string
    contact_number: string
    location: string
    product_id: string
    channel: string
    status: string
    created_at: string
  }
  whatsapp_url: string
}

export async function submitWholesaleInquiry(
  input: WholesaleInquiryInput
): Promise<{ success: boolean; whatsapp_url?: string; error?: string }> {
  const headers = await getAuthHeaders()

  let sourceDomain = input.source_domain
  if (!sourceDomain) {
    try {
      const h = await nextHeaders()
      sourceDomain = h.get("x-tenant-handle")
        ? `${h.get("x-tenant-handle")}.factorytribe.com`
        : h.get("x-forwarded-host") || h.get("host") || null
    } catch {}
  }

  const payload: WholesaleInquiryInput = {
    ...input,
    source_domain: sourceDomain || undefined,
  }

  try {
    const data = await sdk.client.fetch<WholesaleInquiryResponse>(
      "/store/inquiries",
      {
        method: "POST",
        body: payload,
        headers,
      }
    )

    return {
      success: true,
      whatsapp_url: data.whatsapp_url,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to submit wholesale inquiry",
    }
  }
}
