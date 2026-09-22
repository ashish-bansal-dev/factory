import { useState } from "react";
import { GlobeEurope, ArrowUpRightOnBox } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@lib/client";

interface StoreDomainSectionProps {
  seller: any;
}

export const StoreDomainSection = ({ seller }: StoreDomainSectionProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState(
    seller?.metadata?.domain_settings?.custom_domain || ""
  );

  const baseDomain =
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "localhost:8000"
      : "factorytribe.com";

  const activeSubdomain = `${seller.handle}.${baseDomain}`;
  const storefrontUrl = `http://${activeSubdomain}`;

  const currentMetadata = (seller?.metadata || {}) as Record<string, any>;
  const domainSettings = currentMetadata.domain_settings || {};
  const pendingRequest =
    domainSettings.subdomain_request?.status === "pending"
      ? domainSettings.subdomain_request
      : null;

  const handleDomainApproval = async (
    action: "approve_subdomain" | "reject_subdomain" | "configure_custom_domain",
    extraData?: { requested_subdomain?: string; custom_domain?: string }
  ) => {
    try {
      setIsSubmitting(true);

      let updatedHandle = seller.handle;
      let updatedDomainSettings = { ...domainSettings };

      if (action === "approve_subdomain") {
        const requestedHandle =
          extraData?.requested_subdomain ||
          pendingRequest?.requested_subdomain;
        if (!requestedHandle) {
          toast.error("No requested subdomain to approve.");
          return;
        }
        updatedHandle = requestedHandle;
        updatedDomainSettings = {
          ...updatedDomainSettings,
          subdomain: requestedHandle,
          subdomain_request: {
            ...updatedDomainSettings.subdomain_request,
            status: "approved",
            approved_at: new Date().toISOString(),
          },
        };
      } else if (action === "reject_subdomain") {
        updatedDomainSettings = {
          ...updatedDomainSettings,
          subdomain_request: {
            ...updatedDomainSettings.subdomain_request,
            status: "rejected",
            rejected_at: new Date().toISOString(),
          },
        };
      } else if (action === "configure_custom_domain") {
        const domain = (extraData?.custom_domain ?? customDomainInput).trim();
        updatedDomainSettings = {
          ...updatedDomainSettings,
          custom_domain: domain || null,
          custom_domain_verified: Boolean(domain),
        };
      }

      await sdk.admin.sellers.$id.mutate({
        $id: seller.id,
        handle: updatedHandle,
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      });

      toast.success(
        action === "approve_subdomain"
          ? "Subdomain approved and updated!"
          : action === "reject_subdomain"
          ? "Subdomain request rejected."
          : "Custom domain mapping saved!"
      );

      // Invalidate seller query so UI updates immediately
      queryClient.invalidateQueries({ queryKey: [["seller", seller.id]] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update domain settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <Container className="p-0 overflow-hidden divide-y divide-ui-border-base">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <GlobeEurope className="text-ui-fg-muted" />
          <Heading level="h2" className="text-base font-semibold">
            Storefront & Domain Settings
          </Heading>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-y-4">
        {/* Active Dedicated Subdomain */}
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
            Active Storefront Subdomain
          </Text>
          <div className="flex items-center justify-between gap-2 p-3 bg-ui-bg-subtle rounded-lg border border-ui-border-base">
            <span className="font-mono text-xs text-ui-fg-base truncate">
              {activeSubdomain}
            </span>
            <div className="flex items-center gap-x-2 shrink-0">
              <Button
                variant="secondary"
                size="small"
                onClick={() => copyToClipboard(storefrontUrl)}
              >
                Copy URL
              </Button>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

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
                isLoading={isSubmitting}
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
                isLoading={isSubmitting}
                onClick={() => handleDomainApproval("reject_subdomain")}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Custom Domain Mapping */}
        <div className="pt-2 border-t border-ui-border-base">
          <div className="flex items-center justify-between mb-2">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Custom Domain Mapping
            </Text>
            {domainSettings.custom_domain ? (
              <Badge color={domainSettings.custom_domain_verified ? "green" : "grey"} size="2xsmall">
                {domainSettings.custom_domain_verified ? "Verified" : "Pending DNS"}
              </Badge>
            ) : (
              <Badge size="2xsmall" color="grey">Not Assigned</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Input
              size="small"
              placeholder="e.g. b2b.brandname.com"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
            />
            <Button
              size="small"
              variant="secondary"
              isLoading={isSubmitting}
              onClick={() =>
                handleDomainApproval("configure_custom_domain", {
                  custom_domain: customDomainInput.trim(),
                })
              }
            >
              Save & Verify
            </Button>
          </div>

          <div className="p-3 bg-ui-bg-subtle rounded-lg text-xs text-ui-fg-muted">
            <div className="font-medium text-ui-fg-subtle mb-1">DNS Configuration Guide:</div>
            <div>Add a CNAME record in your domain registrar:</div>
            <div className="font-mono mt-1 text-[11px] bg-ui-bg-base p-1.5 rounded border border-ui-border-base">
              CNAME &rarr; {baseDomain}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
