export type TenantType = "subdomain" | "custom_domain" | "marketplace"

export interface TenantContext {
  isTenant: boolean
  tenantType: TenantType
  handle: string | null
  customDomain?: string | null
  baseDomain: string
  channel: "wholesale"
}

export function resolveTenant(
  rawHost: string,
  configuredBaseDomain?: string
): TenantContext {
  // Strip protocol if present
  let host = rawHost.replace(/^[a-zA-Z]+:\/\//, "").trim().toLowerCase()
  const [hostname] = host.split(":")

  const defaultBaseDomain =
    configuredBaseDomain ||
    process.env.NEXT_PUBLIC_BASE_DOMAIN ||
    "factorytribe.com"

  const baseDomain = defaultBaseDomain.toLowerCase().split(":")[0]

  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)

  // Base case: root marketplace hub
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    isIpAddress ||
    hostname === baseDomain ||
    hostname === `www.${baseDomain}` ||
    hostname === "factorytribe.com" ||
    hostname === "www.factorytribe.com" ||
    hostname.endsWith(".pages.dev") ||
    hostname.endsWith(".workers.dev") ||
    hostname.endsWith(".vercel.app")
  ) {
    return {
      isTenant: false,
      tenantType: "marketplace",
      handle: null,
      baseDomain,
      channel: "wholesale",
    }
  }

  // Check for localhost subdomains like seller.localhost or seller.localhost:8787
  const localhostMatch = hostname.match(/^([a-z0-9-_]+)\.localhost$/)
  if (localhostMatch) {
    const subdomain = localhostMatch[1]
    if (!["www", "api", "admin", "vendor", "app"].includes(subdomain)) {
      return {
        isTenant: true,
        tenantType: "subdomain",
        handle: subdomain,
        baseDomain,
        channel: "wholesale",
      }
    }
    return {
      isTenant: false,
      tenantType: "marketplace",
      handle: null,
      baseDomain,
      channel: "wholesale",
    }
  }

  // Handle subdomain matching: hostname ends with .${baseDomain} or .factorytribe.com
  const factorytribeDomain = "factorytribe.com"
  const matchesBase = hostname.endsWith(`.${baseDomain}`)
  const matchesFactorytribe = hostname.endsWith(`.${factorytribeDomain}`)

  if (matchesBase || matchesFactorytribe) {
    const activeDomain = matchesBase ? baseDomain : factorytribeDomain
    const subdomain = hostname.slice(0, -(activeDomain.length + 1))

    // Reserved system subdomains
    if (["www", "api", "admin", "vendor", "app", "staging"].includes(subdomain)) {
      return {
        isTenant: false,
        tenantType: "marketplace",
        handle: null,
        baseDomain,
        channel: "wholesale",
      }
    }

    return {
      isTenant: true,
      tenantType: "subdomain",
      handle: subdomain,
      baseDomain,
      channel: "wholesale",
    }
  }

  // Treat unexpected external hosts as candidate custom domains
  return {
    isTenant: true,
    tenantType: "custom_domain",
    handle: null,
    customDomain: hostname,
    baseDomain,
    channel: "wholesale",
  }
}
