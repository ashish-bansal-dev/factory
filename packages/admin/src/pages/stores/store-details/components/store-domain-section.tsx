import { useState } from "react"
import { ArrowUpRightOnBox, GlobeEurope, PencilSquare, Trash } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useQueryClient } from "@tanstack/react-query"
import { DomainMappingDTO, SellerDTO } from "@mercurjs/types"

import {
  useAdminCheckSellerDomainDns,
  useAdminCreateSellerDomain,
  useAdminDeleteSellerDomain,
  useAdminSellerDomains,
  useAdminUpdateSellerDomain,
  useAdminVerifySellerDomain,
} from "../../../../hooks/api/domains"
import { sdk } from "../../../../lib/client"

interface StoreDomainSectionProps {
  seller: SellerDTO & {
    metadata?: Record<string, unknown> | null
  }
}

export const StoreDomainSection = ({ seller }: StoreDomainSectionProps) => {
  const queryClient = useQueryClient()
  const { domains, refetch: refetchDomains } = useAdminSellerDomains(seller.id)
  const { mutateAsync: createDomain, isPending: isCreating } = useAdminCreateSellerDomain(seller.id)
  const { mutateAsync: updateDomain, isPending: isUpdating } = useAdminUpdateSellerDomain(seller.id)
  const { mutateAsync: checkDomainDns, isPending: isCheckingDns } = useAdminCheckSellerDomainDns(seller.id)
  const { mutateAsync: verifyDomain, isPending: isVerifying } = useAdminVerifySellerDomain(seller.id)
  const { mutateAsync: deleteDomain, isPending: isDeleting } = useAdminDeleteSellerDomain(seller.id)

  const [retailInput, setRetailInput] = useState("")
  const [wholesaleInput, setWholesaleInput] = useState("")
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null)
  const [editingDomainInput, setEditingDomainInput] = useState("")
  const [activeActionDomainId, setActiveActionDomainId] = useState<string | null>(null)
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false)

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
    subdomain?: string
    subdomain_request?: {
      requested_subdomain?: string
      reason?: string
      status?: string
      requested_at?: string
      approved_at?: string
      rejected_at?: string
      [key: string]: unknown
    }
    [key: string]: unknown
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
        `${channel === "retail" ? "Retail" : "Wholesale"} domain registered for seller!`
      )
      if (channel === "retail") setRetailInput("")
      else setWholesaleInput("")
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add domain."
      toast.error(message)
    }
  }

  const handleSaveDomainEdit = async (domain: DomainMappingDTO) => {
    const cleanDomain = editingDomainInput.trim().toLowerCase()
    if (!cleanDomain) {
      toast.error("Please enter a domain name.")
      return
    }

    if (cleanDomain === domain.domain) {
      setEditingDomainId(null)
      setEditingDomainInput("")
      return
    }

    try {
      setActiveActionDomainId(domain.id)
      await updateDomain({
        domainId: domain.id,
        payload: {
          domain: cleanDomain,
        },
      })
      toast.success(
        `${domain.channel_type === "retail" ? "Retail" : "Wholesale"} domain updated successfully!`
      )
      setEditingDomainId(null)
      setEditingDomainInput("")
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update domain."
      toast.error(message)
    } finally {
      setActiveActionDomainId(null)
    }
  }

  const handleCancelDomainEdit = () => {
    setEditingDomainId(null)
    setEditingDomainInput("")
  }

  const handleCheckDns = async (domain: DomainMappingDTO) => {
    try {
      setActiveActionDomainId(domain.id)
      const res = await checkDomainDns({ domainId: domain.id })
      if (res.verified) {
        toast.success(`Domain ${domain.domain} verified via DNS!`)
      } else {
        toast.error(
          res.message || "DNS records not yet detected. Check CNAME and TXT values."
        )
      }
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "DNS verification check failed."
      toast.error(message)
    } finally {
      setActiveActionDomainId(null)
    }
  }

  const handleManualVerify = async (domain: DomainMappingDTO) => {
    try {
      setActiveActionDomainId(domain.id)
      await verifyDomain({ domainId: domain.id })
      toast.success(`Domain ${domain.domain} marked verified by admin override!`)
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify domain."
      toast.error(message)
    } finally {
      setActiveActionDomainId(null)
    }
  }

  const handleDeleteDomain = async (domain: DomainMappingDTO) => {
    try {
      setActiveActionDomainId(domain.id)
      await deleteDomain({ domainId: domain.id })
      toast.success(`Domain ${domain.domain} deleted.`)
      refetchDomains()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete domain."
      toast.error(message)
    } finally {
      setActiveActionDomainId(null)
    }
  }

  const handleDomainApproval = async (
    action: "approve_subdomain" | "reject_subdomain",
    extraData?: { requested_subdomain?: string }
  ) => {
    try {
      setIsSubmittingApproval(true)

      let updatedHandle = seller.handle
      let updatedDomainSettings = { ...domainSettings }

      if (action === "approve_subdomain") {
        const requestedHandle =
          extraData?.requested_subdomain ||
          pendingRequest?.requested_subdomain
        if (!requestedHandle) {
          toast.error("No requested subdomain to approve.")
          return
        }
        updatedHandle = requestedHandle
        updatedDomainSettings = {
          ...updatedDomainSettings,
          subdomain: requestedHandle,
          subdomain_request: {
            ...updatedDomainSettings.subdomain_request,
            status: "approved",
            approved_at: new Date().toISOString(),
          },
        }
      } else if (action === "reject_subdomain") {
        updatedDomainSettings = {
          ...updatedDomainSettings,
          subdomain_request: {
            ...updatedDomainSettings.subdomain_request,
            status: "rejected",
            rejected_at: new Date().toISOString(),
          },
        }
      }

      await (sdk.admin.sellers.$id as { mutate: (payload: { $id: string; handle?: string; metadata?: Record<string, unknown> }) => Promise<unknown> }).mutate({
        $id: seller.id,
        handle: updatedHandle,
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      })

      toast.success(
        action === "approve_subdomain"
          ? "Subdomain approved and updated!"
          : "Subdomain request rejected."
      )

      queryClient.invalidateQueries({ queryKey: [["seller", seller.id]] })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update domain request."
      toast.error(message)
    } finally {
      setIsSubmittingApproval(false)
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge color="green" size="2xsmall">Verified</Badge>
      case "failed":
        return <Badge color="red" size="2xsmall">DNS Failed</Badge>
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
            Storefront & Domain Management
          </Heading>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-y-8">
        {/* Pending Subdomain Request Banner */}
        {pendingRequest && (
          <div className="border border-ui-border-warning bg-ui-bg-warning-subtle p-4 rounded-xl">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <Badge color="orange" size="2xsmall">
                  Pending Request
                </Badge>
                <Heading level="h3" className="text-sm font-semibold mt-1">
                  Vendor requested subdomain:{" "}
                  <span className="font-mono text-ui-fg-interactive">
                    {pendingRequest.requested_subdomain}
                  </span>
                </Heading>
              </div>
            </div>
            {pendingRequest.reason && (
              <Text size="small" className="text-ui-fg-subtle mb-3">
                Reason: {pendingRequest.reason}
              </Text>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="small"
                variant="primary"
                isLoading={isSubmittingApproval}
                onClick={() =>
                  handleDomainApproval("approve_subdomain", {
                    requested_subdomain: pendingRequest.requested_subdomain,
                  })
                }
              >
                Approve Subdomain
              </Button>
              <Button
                size="small"
                variant="secondary"
                isLoading={isSubmittingApproval}
                onClick={() => handleDomainApproval("reject_subdomain")}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Retail Channel (ThreadBuy) */}
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge color="blue" size="2xsmall">Retail</Badge>
              <Heading level="h3" className="text-sm font-semibold">
                ThreadBuy Retail Domains
              </Heading>
            </div>
            <span className="text-xs text-ui-fg-muted font-mono">{retailBaseDomain}</span>
          </div>

          {/* Platform Subdomain */}
          <div className="flex items-center justify-between gap-2 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-ui-fg-muted">Active Platform Subdomain</span>
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
                Copy URL
              </Button>
              <a
                href={`http://${retailSubdomain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Custom Retail Domain */}
          <div className="p-4 bg-ui-bg-field rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-2">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                Custom Retail Domain
              </Text>
              {retailCustomDomain ? (
                renderStatusBadge(retailCustomDomain.verification_status)
              ) : (
                <Badge size="2xsmall" color="grey">Not Assigned</Badge>
              )}
            </div>

            {retailCustomDomain ? (
              <div className="flex flex-col gap-y-3">
                {editingDomainId === retailCustomDomain.id ? (
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        size="small"
                        value={editingDomainInput}
                        onChange={(e) => setEditingDomainInput(e.target.value)}
                        placeholder="e.g. brand.com"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleSaveDomainEdit(retailCustomDomain)
                          } else if (e.key === "Escape") {
                            e.preventDefault()
                            handleCancelDomainEdit()
                          }
                        }}
                      />
                      <Button
                        size="small"
                        variant="primary"
                        isLoading={isUpdating && activeActionDomainId === retailCustomDomain.id}
                        onClick={() => handleSaveDomainEdit(retailCustomDomain)}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        disabled={isUpdating && activeActionDomainId === retailCustomDomain.id}
                        onClick={handleCancelDomainEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Updating domain resets DNS verification until new records are confirmed.
                    </Text>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-ui-fg-base">
                      {retailCustomDomain.domain}
                    </span>
                    <div className="flex items-center gap-x-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setEditingDomainId(retailCustomDomain.id)
                          setEditingDomainInput(retailCustomDomain.domain)
                        }}
                      >
                        <PencilSquare className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        isLoading={isCheckingDns && activeActionDomainId === retailCustomDomain.id}
                        onClick={() => handleCheckDns(retailCustomDomain)}
                      >
                        Check DNS
                      </Button>
                      {retailCustomDomain.verification_status !== "verified" && (
                        <Button
                          size="small"
                          variant="primary"
                          isLoading={isVerifying && activeActionDomainId === retailCustomDomain.id}
                          onClick={() => handleManualVerify(retailCustomDomain)}
                        >
                          Manual Verify
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="danger"
                        isLoading={isDeleting && activeActionDomainId === retailCustomDomain.id}
                        onClick={() => handleDeleteDomain(retailCustomDomain)}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {retailCustomDomain.verification_token && (
                  <div className="p-2.5 bg-ui-bg-subtle rounded border border-ui-border-base text-xs space-y-1">
                    <div className="text-ui-fg-muted font-medium">Expected DNS Records:</div>
                    <div className="font-mono text-[11px]">CNAME &rarr; {retailBaseDomain}</div>
                    <div className="font-mono text-[11px] truncate">
                      TXT &rarr; threadbuy-verify={retailCustomDomain.verification_token}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  placeholder="e.g. brand.com"
                  value={retailInput}
                  onChange={(e) => setRetailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddDomain("retail")
                    }
                  }}
                />
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={isCreating}
                  onClick={() => handleAddDomain("retail")}
                >
                  Add Retail Domain
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Wholesale Channel (FactoryTribe) */}
        <div className="flex flex-col gap-y-3 pt-4 border-t border-ui-border-base">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge color="purple" size="2xsmall">Wholesale</Badge>
              <Heading level="h3" className="text-sm font-semibold">
                FactoryTribe Wholesale Domains
              </Heading>
            </div>
            <span className="text-xs text-ui-fg-muted font-mono">{wholesaleBaseDomain}</span>
          </div>

          {/* Platform Subdomain */}
          <div className="flex items-center justify-between gap-2 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-ui-fg-muted">Active Platform Subdomain</span>
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
                Copy URL
              </Button>
              <a
                href={`http://${wholesaleSubdomain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Custom Wholesale Domain */}
          <div className="p-4 bg-ui-bg-field rounded-lg border border-ui-border-base">
            <div className="flex items-center justify-between mb-2">
              <Text size="small" weight="plus" className="text-ui-fg-base">
                Custom Wholesale Domain
              </Text>
              {wholesaleCustomDomain ? (
                renderStatusBadge(wholesaleCustomDomain.verification_status)
              ) : (
                <Badge size="2xsmall" color="grey">Not Assigned</Badge>
              )}
            </div>

            {wholesaleCustomDomain ? (
              <div className="flex flex-col gap-y-3">
                {editingDomainId === wholesaleCustomDomain.id ? (
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        size="small"
                        value={editingDomainInput}
                        onChange={(e) => setEditingDomainInput(e.target.value)}
                        placeholder="e.g. b2b.brand.com"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleSaveDomainEdit(wholesaleCustomDomain)
                          } else if (e.key === "Escape") {
                            e.preventDefault()
                            handleCancelDomainEdit()
                          }
                        }}
                      />
                      <Button
                        size="small"
                        variant="primary"
                        isLoading={isUpdating && activeActionDomainId === wholesaleCustomDomain.id}
                        onClick={() => handleSaveDomainEdit(wholesaleCustomDomain)}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        disabled={isUpdating && activeActionDomainId === wholesaleCustomDomain.id}
                        onClick={handleCancelDomainEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                    <Text size="xsmall" className="text-ui-fg-muted">
                      Updating domain resets DNS verification until new records are confirmed.
                    </Text>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-ui-fg-base">
                      {wholesaleCustomDomain.domain}
                    </span>
                    <div className="flex items-center gap-x-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => {
                          setEditingDomainId(wholesaleCustomDomain.id)
                          setEditingDomainInput(wholesaleCustomDomain.domain)
                        }}
                      >
                        <PencilSquare className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        isLoading={isCheckingDns && activeActionDomainId === wholesaleCustomDomain.id}
                        onClick={() => handleCheckDns(wholesaleCustomDomain)}
                      >
                        Check DNS
                      </Button>
                      {wholesaleCustomDomain.verification_status !== "verified" && (
                        <Button
                          size="small"
                          variant="primary"
                          isLoading={isVerifying && activeActionDomainId === wholesaleCustomDomain.id}
                          onClick={() => handleManualVerify(wholesaleCustomDomain)}
                        >
                          Manual Verify
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="danger"
                        isLoading={isDeleting && activeActionDomainId === wholesaleCustomDomain.id}
                        onClick={() => handleDeleteDomain(wholesaleCustomDomain)}
                      >
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {wholesaleCustomDomain.verification_token && (
                  <div className="p-2.5 bg-ui-bg-subtle rounded border border-ui-border-base text-xs space-y-1">
                    <div className="text-ui-fg-muted font-medium">Expected DNS Records:</div>
                    <div className="font-mono text-[11px]">CNAME &rarr; {wholesaleBaseDomain}</div>
                    <div className="font-mono text-[11px] truncate">
                      TXT &rarr; factorytribe-verify={wholesaleCustomDomain.verification_token}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  placeholder="e.g. b2b.brand.com"
                  value={wholesaleInput}
                  onChange={(e) => setWholesaleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddDomain("wholesale")
                    }
                  }}
                />
                <Button
                  size="small"
                  variant="secondary"
                  isLoading={isCreating}
                  onClick={() => handleAddDomain("wholesale")}
                >
                  Add Wholesale Domain
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}
