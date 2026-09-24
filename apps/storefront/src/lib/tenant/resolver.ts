export type TenantType = "subdomain" | "custom_domain" | "marketplace"

export interface TenantContext {
  isTenant: boolean
  tenantType: TenantType
  handle: string | null
  customDomain?: string | null
  baseDomain: string
  channel: "retail"
}

export function resolveTenant(
  rawHost: string,
  configuredBaseDomain?: string
): TenantContext {
  let host = rawHost.replace(/^[a-zA-Z]+:\/\//, "").trim().toLowerCase()

  const defaultBaseDomain =
    configuredBaseDomain ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    "threadbuy.com"

  const baseDomain = defaultBaseDomain.toLowerCase()

  // Base case: root marketplace hub
  if (
    !host ||
    host === baseDomain ||
    host === `www.${baseDomain}` ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "localhost:3000"
  ) {
    return {
      isTenant: false,
      tenantType: "marketplace",
      handle: null,
      baseDomain,
      channel: "retail",
    }
  }

  // Handle subdomain matching: host ends with .${baseDomain} or .threadbuy.com
  const threadbuyDomain = "threadbuy.com"
  const matchesBase = host.endsWith(`.${baseDomain}`)
  const matchesThreadbuy = host.endsWith(`.${threadbuyDomain}`)

  if (matchesBase || matchesThreadbuy) {
    const activeDomain = matchesBase ? baseDomain : threadbuyDomain
    const subdomain = host.slice(0, -(activeDomain.length + 1))

    // Reserved system subdomains
    if (["www", "api", "admin", "vendor", "app"].includes(subdomain)) {
      return {
        isTenant: false,
        tenantType: "marketplace",
        handle: null,
        baseDomain,
        channel: "retail",
      }
    }

    return {
      isTenant: true,
      tenantType: "subdomain",
      handle: subdomain,
      baseDomain,
      channel: "retail",
    }
  }

  // Check for localhost subdomains like seller.localhost or seller.localhost:3000
  const localhostMatch = host.match(/^([a-z0-9-_]+)\.localhost(?::\d+)?$/)
  if (localhostMatch) {
    const subdomain = localhostMatch[1]
    if (!["www", "api", "admin"].includes(subdomain)) {
      return {
        isTenant: true,
        tenantType: "subdomain",
        handle: subdomain,
        baseDomain,
        channel: "retail",
      }
    }
  }

  // External hosts treated as custom domains
  return {
    isTenant: true,
    tenantType: "custom_domain",
    handle: null,
    customDomain: host,
    baseDomain,
    channel: "retail",
  }
}
