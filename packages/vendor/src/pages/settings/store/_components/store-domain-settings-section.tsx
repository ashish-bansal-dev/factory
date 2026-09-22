import { useState } from "react";
import { GlobeEurope, ArrowUpRightOnBox } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";
import { sdk } from "@lib/client";

interface StoreDomainSettingsSectionProps {
  seller: any;
}

export const StoreDomainSettingsSection = ({
  seller,
}: StoreDomainSettingsSectionProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSubdomainInput, setNewSubdomainInput] = useState("");
  const [requestReason, setRequestReason] = useState("");
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

  const handleSubdomainRequest = async () => {
    if (!newSubdomainInput.trim()) {
      toast.error("Please enter your desired subdomain.");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanSubdomain = newSubdomainInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

      const updatedDomainSettings = {
        ...domainSettings,
        subdomain_request: {
          requested_subdomain: cleanSubdomain,
          reason: requestReason.trim(),
          status: "pending",
          requested_at: new Date().toISOString(),
        },
      };

      await (sdk.vendor.sellers.me as any).mutate({
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      });

      toast.success("Subdomain change request submitted to admin for approval!");
      setNewSubdomainInput("");
      setRequestReason("");
      queryClient.invalidateQueries({ queryKey: [["seller", "me"]] });
      queryClient.invalidateQueries({ queryKey: [["seller", seller.id]] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit domain request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomDomainSave = async () => {
    try {
      setIsSubmitting(true);
      const cleanDomain = customDomainInput.trim().toLowerCase();

      const updatedDomainSettings = {
        ...domainSettings,
        custom_domain: cleanDomain || null,
        custom_domain_verified: false,
      };

      await (sdk.vendor.sellers.me as any).mutate({
        metadata: {
          ...currentMetadata,
          domain_settings: updatedDomainSettings,
        },
      });

      toast.success("Custom domain submitted! Admin will verify DNS CNAME records.");
      queryClient.invalidateQueries({ queryKey: [["seller", "me"]] });
      queryClient.invalidateQueries({ queryKey: [["seller", seller.id]] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save custom domain.");
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
            Dedicated Wholesale Storefront URL
          </Heading>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-y-5">
        {/* Active Dedicated Subdomain */}
        <div>
          <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
            Your Public Storefront Address
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
                Copy Link
              </Button>
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-ui-fg-interactive font-medium hover:underline px-2"
              >
                Visit Store <ArrowUpRightOnBox className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Subdomain Change Request */}
        <div className="pt-2 border-t border-ui-border-base">
          <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
            Request Subdomain Change
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted mb-3">
            Want to rebrand your storefront handle? Submit a new subdomain for admin review.
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
                  isLoading={isSubmitting}
                  onClick={handleSubdomainRequest}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Domain Configuration */}
        <div className="pt-2 border-t border-ui-border-base">
          <Text size="small" weight="plus" className="text-ui-fg-subtle mb-1">
            Custom Domain (e.g. wholesale.yourbrand.com)
          </Text>
          <div className="flex items-center gap-2 mb-2">
            <Input
              size="small"
              placeholder="wholesale.yourbrand.com"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
            />
            <Button
              size="small"
              variant="secondary"
              isLoading={isSubmitting}
              onClick={handleCustomDomainSave}
            >
              Save Custom Domain
            </Button>
          </div>
          <Text size="xsmall" className="text-ui-fg-muted">
            Point your custom domain's CNAME record to <span className="font-mono text-ui-fg-base">{baseDomain}</span>.
          </Text>
        </div>
      </div>
    </Container>
  );
};
