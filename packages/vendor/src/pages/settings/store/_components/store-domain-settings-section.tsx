import { useState } from "react"
import { ArrowUpRightOnBox, CheckCircle, ExclamationCircle, GlobeEurope, Trash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useQueryClient } from "@tanstack/react-query"
import { DomainMappingDTO, SellerDTO } from "@mercurjs/types"

import {
  useVendorCheckDomainDns,
  useVendorCreateDomain,
  useVendorDeleteDomain,
  useVendorDomains,
} from "../../../../hooks/api/domains"
import { sdk } from "@lib/client"

interface StoreDomainSettingsSectionProps {
  seller: SellerDTO & {
    metadata?: Record<string, unknown> | null
  }
}

export const StoreDomainSettingsSection = ({
  seller,
}: StoreDomainSettingsSectionProps) => {
  const queryClient = useQueryClient()
  const { domains, refetch: refetchDomains } = useVendorDomains()
  const { mutateAsync: createDomain, isPending: isCreating } = useVendorCreateDomain()
  const { mutateAsync: checkDomainDns, isPending: isCheckingDns } = useVendorCheckDomainDns()
  const { mutateAsync: deleteDomain, isPending: isDeleting } = useVendorDeleteDomain()

  const [retailInput, setRetailInput] = useState("")
  const [wholesaleInput, setWholesaleInput] = useState("")
  const [checkingDomainId, setCheckingDomainId] = useState<string | null>(null)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const [newSubdomainInput, setNewSubdomainInput] = useState("")
  const [requestReason, setRequestReason] = useState("")

  const domainList = (domains ?? []) as DomainMappingDTO[]
  const retailCustomDomain = domainList.find(
    (d) => d.channel_type === "retail" && d.is_custom_domain
  )
  const wholesaleCustomDomain = domainList.find(
    (d) => d.channel_type === "wholesale" && d.is_custom_domain
  )

  const isLocal =
    typeof window !== "undefined" && window.location.hostname === "localhost"
  const retailBaseDomain = isLocal ? "localhost:3000" : "threadbuy.com"
  const wholesaleBaseDomain = isLocal ? "localhost:8000" : "factorytribe.com"

  const retailSubdomain = `${seller.handle}.${retailBaseDomain}`
  const wholesaleSubdomain = `${seller.handle}.${wholesaleBaseDomain}`

  const currentMetadata = (seller?.metadata || {}) as Record<string, unknown>
  const domainSettings = (currentMetadata.domain_settings || {}) as {
    subdomain_request?: {
      requested_subdomain?: string
      reason?: string
      status?: string
      requested_at?: string
    }
  }
  const pendingRequest =
    domainSettings.subdomain_request?.status === "pending"
      ? domainSettings.subdomain_request
      : null

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleAddDomain = async (channel: "retail" | "wholesale") => {
    const rawInput = channel === "retail" ? retailInput : wholesaleInput
    const cleanDomain = rawInput.trim().toLowerCase()
    if (!cleanDomain) {
      toast.error("Please enter a domain name.")
      return
    }

    try {
      await createDomain({
        domain: cleanDomain,
        channel_type: channel,
        is_custom_domain: true,
      })
      toast.success(
        `${channel === "retail" ? "Retail" : "Wholesale"} domain registered! Configure DNS records below.`
      )
      if (channel === "retail") setRetailInput("")
      else setWholesaleInput("")
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add domain."
      toast.error(message)
    }
  }

  const handleCheckDns = async (domain: DomainMappingDTO) => {
    try {
      setCheckingDomainId(domain.id)
      const res = await checkDomainDns({ domainId: domain.id })
      if (res.verified) {
        toast.success(`Domain ${domain.domain} is verified and active!`)
      } else {
        toast.error(
          res.message || "DNS verification pending. Please allow up to 24h for DNS propagation."
        )
      }
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "DNS verification check failed."
      toast.error(message)
    } finally {
      setCheckingDomainId(null)
    }
  }

  const handleDeleteDomain = async (domain: DomainMappingDTO) => {
    try {
      await deleteDomain({ domainId: domain.id })
      toast.success(`Domain ${domain.domain} removed.`)
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete domain."
      toast.error(message)
    }
  }

  const handleSubdomainRequest = async () => {
    if (!newSubdomainInput.trim()) {
      toast.error("Please enter your desired subdomain.")
      return
    }

    try {
      setIsSubmittingRequest(true)
      const cleanSubdomain = newSubdomainInput
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "")

      const updatedDomainSettings = {
        ...domainSettings,
        subdomain_request: {
          requested_subdomain: cleanSubdomain,
          reason: requestReason.trim(),
          status: "pending",
          requested_at: new Date().toISOString(),
        },
      }

      await (sdk.vendor.sellers.me as { mutate: (payload: { metadata: Record<string, unknown> }) => Promise<unknown> }).mutate({
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      })

      toast.success("Subdomain change request submitted to admin for approval!")
      setNewSubdomainInput("")
      setRequestReason("")
      queryClient.invalidateQueries({ queryKey: [["seller", "me"]] })
      queryClient.invalidateQueries({ queryKey: [["seller", seller.id]] })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit domain request."
      toast.error(message)
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge color="green" size="2xsmall">Verified</Badge>
      case "failed":
        return <Badge color="red" size="2xsmall">DNS Check Failed</Badge>
      default:
        return <Badge color="orange" size="2xsmall">Pending DNS</Badge>
    }
  }

  return (
    <Container className="p-0 overflow-hidden divide-y divide-ui-border-base">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <GlobeEurope className="text-ui-fg-muted" />
          <Heading level="h2" className="text-base font-semibold">
            Storefront Domain Configuration
          </Heading>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-y-8">
        {/* Retail Channel (ThreadBuy) */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge color="blue" size="2xsmall">Retail</Badge>
                <Heading level="h3" className="text-sm font-semibold">
                  ThreadBuy Retail Storefront
                </Heading>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted mt-0.5">
                Public consumer-facing store on ThreadBuy
              </Text>
            </div>
          </div>

          {/* Retail Assigned Subdomain */}
          <div className="flex items-center justify-between gap-2 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-ui-fg-muted">Assigned Platform Subdomain</span>
              <span className="font-mono text-xs text-ui-fg-base mt-0.5">
                {retailSubdomain}
              </span>
            </div>
            <div className="flex items-center gap-x-2 shrink-0">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleCopy(`http://${retailSubdomain}`)}
              >
                Copy Link
              </Button>
              <a
                href={`http://${retailSubdomain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit Store <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Retail Custom Domain */}
          <div className="p-4 bg-ui-bg-field rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-2">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                Custom Retail Domain
              </Text>
              {retailCustomDomain ? (
                renderStatusBadge(retailCustomDomain.verification_status)
              ) : (
                <Badge size="2xsmall" color="grey">Not Connected</Badge>
              )}
            </div>

            {retailCustomDomain ? (
              <div className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-ui-fg-base">
                    {retailCustomDomain.domain}
                  </span>
                  <div className="flex items-center gap-x-2">
                    <Button
                      size="small"
                      variant="secondary"
                      isLoading={isCheckingDns && checkingDomainId === retailCustomDomain.id}
                      onClick={() => handleCheckDns(retailCustomDomain)}
                    >
                      Check DNS
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      isLoading={isDeleting}
                      onClick={() => handleDeleteDomain(retailCustomDomain)}
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {retailCustomDomain.verification_status !== "verified" && (
                  <div className="p-3 bg-ui-bg-subtle rounded border border-ui-border-base text-xs space-y-2">
                    <div className="font-medium text-ui-fg-base flex items-center gap-1">
                      <ExclamationCircle className="w-3.5 h-3.5 text-ui-fg-warning" />
                      Verification Instructions:
                    </div>
                    <div>1. Add CNAME record at your DNS provider:</div>
                    <div className="font-mono text-[11px] bg-ui-bg-base p-1.5 rounded border border-ui-border-base flex justify-between items-center">
                      <span>CNAME &rarr; {retailBaseDomain}</span>
                      <Button size="2xsmall" variant="transparent" onClick={() => handleCopy(retailBaseDomain)}>Copy</Button>
                    </div>
                    {retailCustomDomain.verification_token && (
                      <>
                        <div>2. Add TXT record for verification:</div>
                        <div className="font-mono text-[11px] bg-ui-bg-base p-1.5 rounded border border-ui-border-base flex justify-between items-center">
                          <span className="truncate">threadbuy-verify={retailCustomDomain.verification_token}</span>
                          <Button size="2xsmall" variant="transparent" onClick={() => handleCopy(`threadbuy-verify=${retailCustomDomain.verification_token}`)}>Copy</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {retailCustomDomain.verification_status === "verified" && (
                  <div className="text-xs text-ui-fg-success flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Traffic to {retailCustomDomain.domain} is authoritatively routed to your ThreadBuy store.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  placeholder="e.g. brand.com or shop.brand.com"
                  value={retailInput}
                  onChange={(e) => setRetailInput(e.target.value)}
                />
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={isCreating}
                  onClick={() => handleAddDomain("retail")}
                >
                  Connect Domain
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wholesale Channel (FactoryTribe) */}
        <div className="flex flex-col gap-y-3 pt-4 border-t border-ui-border-base">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge color="purple" size="2xsmall">Wholesale</Badge>
                <Heading level="h3" className="text-sm font-semibold">
                  FactoryTribe Wholesale Storefront
                </Heading>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted mt-0.5">
                B2B wholesale portal with bulk add and volume packs
              </Text>
            </div>
          </div>

          {/* Wholesale Assigned Subdomain */}
          <div className="flex items-center justify-between gap-2 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-ui-fg-muted">Assigned Platform Subdomain</span>
              <span className="font-mono text-xs text-ui-fg-base mt-0.5">
                {wholesaleSubdomain}
              </span>
            </div>
            <div className="flex items-center gap-x-2 shrink-0">
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleCopy(`http://${wholesaleSubdomain}`)}
              >
                Copy Link
              </Button>
              <a
                href={`http://${wholesaleSubdomain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit Store <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Wholesale Custom Domain */}
          <div className="p-4 bg-ui-bg-field rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-2">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                Custom Wholesale Domain
              </Text>
              {wholesaleCustomDomain ? (
                renderStatusBadge(wholesaleCustomDomain.verification_status)
              ) : (
                <Badge size="2xsmall" color="grey">Not Connected</Badge>
              )}
            </div>

            {wholesaleCustomDomain ? (
              <div className="flex flex-col gap-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-ui-fg-base">
                    {wholesaleCustomDomain.domain}
                  </span>
                  <div className="flex items-center gap-x-2">
                    <Button
                      size="small"
                      variant="secondary"
                      isLoading={isCheckingDns && checkingDomainId === wholesaleCustomDomain.id}
                      onClick={() => handleCheckDns(wholesaleCustomDomain)}
                    >
                      Check DNS
                    </Button>
                    <Button
                      size="small"
                      variant="danger"
                      isLoading={isDeleting}
                      onClick={() => handleDeleteDomain(wholesaleCustomDomain)}
                    >
                      <Trash className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {wholesaleCustomDomain.verification_status !== "verified" && (
                  <div className="p-3 bg-ui-bg-subtle rounded border border-ui-border-base text-xs space-y-2">
                    <div className="font-medium text-ui-fg-base flex items-center gap-1">
                      <ExclamationCircle className="w-3.5 h-3.5 text-ui-fg-warning" />
                      Verification Instructions:
                    </div>
                    <div>1. Add CNAME record at your DNS provider:</div>
                    <div className="font-mono text-[11px] bg-ui-bg-base p-1.5 rounded border border-ui-border-base flex justify-between items-center">
                      <span>CNAME &rarr; {wholesaleBaseDomain}</span>
                      <Button size="2xsmall" variant="transparent" onClick={() => handleCopy(wholesaleBaseDomain)}>Copy</Button>
                    </div>
                    {wholesaleCustomDomain.verification_token && (
                      <>
                        <div>2. Add TXT record for verification:</div>
                        <div className="font-mono text-[11px] bg-ui-bg-base p-1.5 rounded border border-ui-border-base flex justify-between items-center">
                          <span className="truncate">factorytribe-verify={wholesaleCustomDomain.verification_token}</span>
                          <Button size="2xsmall" variant="transparent" onClick={() => handleCopy(`factorytribe-verify=${wholesaleCustomDomain.verification_token}`)}>Copy</Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {wholesaleCustomDomain.verification_status === "verified" && (
                  <div className="text-xs text-ui-fg-success flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Traffic to {wholesaleCustomDomain.domain} is authoritatively routed to your FactoryTribe store.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  placeholder="e.g. b2b.brand.com or wholesale.brand.com"
                  value={wholesaleInput}
                  onChange={(e) => setWholesaleInput(e.target.value)}
                />
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={isCreating}
                  onClick={() => handleAddDomain("wholesale")}
                >
                  Connect Domain
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Subdomain Change Request */}
        <div className="pt-4 border-t border-ui-border-base">
          <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
            Request Subdomain Handle Change
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted mb-3">
            Want to rebrand your storefront handle? Submit a new subdomain for marketplace admin review.
          </Text>

          {pendingRequest ? (
            <div className="border border-ui-border-warning bg-ui-bg-warning-subtle p-3 rounded-lg text-xs">
              <div className="flex items-center gap-x-2 mb-1">
                <Badge color="orange" size="2xsmall">
                  Request Pending
                </Badge>
                <span className="font-medium text-ui-fg-base">
                  Requested handle: <span className="font-mono">{pendingRequest.requested_subdomain}</span>
                </span>
              </div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Awaiting admin review. You will be notified once approved.
              </Text>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  placeholder="e.g. brand-official"
                  value={newSubdomainInput}
                  onChange={(e) => setNewSubdomainInput(e.target.value)}
                />
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={isSubmittingRequest}
                  onClick={handleSubdomainRequest}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
