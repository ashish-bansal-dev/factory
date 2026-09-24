import dns from "node:dns/promises"
import crypto from "node:crypto"

export interface DnsResolver {
  resolveTxt: (host: string) => Promise<string[][]>
  resolveCname: (host: string) => Promise<string[]>
}

export interface DnsCheckOptions {
  domain: string
  verificationToken: string
  expectedCnameTarget?: string
  dnsResolver?: DnsResolver
}

export interface DnsCheckResult {
  verified: boolean
  txtVerified: boolean
  cnameVerified: boolean
  recordsFound: {
    txt: string[]
    cname: string[]
  }
  message: string
}

export const generateVerificationToken = (): string => {
  return `mercur-verify-${crypto.randomBytes(16).toString("hex")}`
}

export const normalizeDomainName = (rawDomain: string): string => {
  let domain = rawDomain.trim().toLowerCase()
  domain = domain.replace(/^https?:\/\//, "")
  domain = domain.split("/")[0]
  domain = domain.split(":")[0]
  return domain
}

export async function verifyDomainDns(
  options: DnsCheckOptions
): Promise<DnsCheckResult> {
  const {
    domain,
    verificationToken,
    expectedCnameTarget,
    dnsResolver = dns,
  } = options

  const cleanDomain = normalizeDomainName(domain)

  let txtVerified = false
  let cnameVerified = false
  const foundTxt: string[] = []
  const foundCname: string[] = []

  const txtHosts = [`_mercur-challenge.${cleanDomain}`, cleanDomain]
  const txtResults = await Promise.all(
    txtHosts.map(async (host) => {
      try {
        return await dnsResolver.resolveTxt(host)
      } catch {
        return []
      }
    })
  )

  for (const records of txtResults) {
    for (const chunk of records) {
      const fullString = chunk.join("")
      foundTxt.push(fullString)
      if (
        fullString === verificationToken ||
        fullString === `mercur-verification=${verificationToken}`
      ) {
        txtVerified = true
      }
    }
  }

  if (expectedCnameTarget) {
    try {
      const cnameRecords = await dnsResolver.resolveCname(cleanDomain)
      const targetNormalized = normalizeDomainName(expectedCnameTarget)
      for (const target of cnameRecords) {
        const cleanedTarget = normalizeDomainName(target)
        foundCname.push(target)
        if (cleanedTarget === targetNormalized) {
          cnameVerified = true
          break
        }
      }
    } catch {
      // CNAME resolution failed or not found
    }
  }

  const verified = txtVerified || cnameVerified

  return {
    verified,
    txtVerified,
    cnameVerified,
    recordsFound: {
      txt: foundTxt,
      cname: foundCname,
    },
    message: verified
      ? "Domain ownership verified successfully via DNS"
      : "DNS verification failed: TXT challenge or CNAME record not detected",
  }
}
