import "server-only"
import { cookies as nextCookies, headers as nextHeaders } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value
    let tenantPrefix = ""
    try {
      const headersList = await nextHeaders()
      const isTenant = headersList.get("x-is-tenant") === "true"
      const handle = headersList.get("x-tenant-handle")
      if (isTenant && handle) {
        tenantPrefix = `tenant-${handle}-`
      }
    } catch {}

    if (!cacheId && !tenantPrefix) {
      return ""
    }

    return `${tenantPrefix}${tag}-${cacheId || "default"}`
  } catch (_error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return {}
  }

  return { tags: [`${cacheTag}`] }
}

export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}


async function resolveCartCookieName(): Promise<string> {
  try {
    const headersList = await nextHeaders()
    const isTenant = headersList.get("x-is-tenant") === "true"
    const handle = headersList.get("x-tenant-handle")
    if (isTenant && handle) {
      return `_medusa_cart_${handle}`
    }
  } catch {}
  return "_medusa_cart_id"
}

export const getCartId = async (tenantHandle?: string | null) => {
  const cookies = await nextCookies()
  const cookieName = tenantHandle ? `_medusa_cart_${tenantHandle}` : await resolveCartCookieName()
  return cookies.get(cookieName)?.value
}

export const setCartId = async (cartId: string, tenantHandle?: string | null) => {
  const cookies = await nextCookies()
  const cookieName = tenantHandle ? `_medusa_cart_${tenantHandle}` : await resolveCartCookieName()
  cookies.set(cookieName, cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async (tenantHandle?: string | null) => {
  const cookies = await nextCookies()
  const cookieName = tenantHandle ? `_medusa_cart_${tenantHandle}` : await resolveCartCookieName()
  cookies.set(cookieName, "", {
    maxAge: -1,
  })
}
