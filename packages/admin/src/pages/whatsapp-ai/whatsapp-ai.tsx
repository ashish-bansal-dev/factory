import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Button,
  Container,
  Copy,
  Heading,
  Input,
  Select,
  StatusBadge,
  Text,
  toast,
} from "@medusajs/ui"
import { ArrowPath, CheckCircle, Eye, EyeSlash, Key } from "@medusajs/icons"
import { fetchQuery } from "../../lib/client"
import { SingleColumnPage } from "../../components/layout/pages"

interface WhatsAppAiConfig {
  whatsapp_phone_number_id?: string
  whatsapp_access_token?: string
  whatsapp_verify_token?: string
  admin_whatsapp_phone?: string
  gemini_api_key?: string
  gemini_model?: string
  text_model?: string
  storefront_url?: string
  vendor_url?: string
}

export const AI_MODELS = [
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  { value: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
  { value: "gemma-4-31b-it", label: "Gemma 4 31B" },
]

const getModelOptions = (currentVal?: string) => {
  const options = [...AI_MODELS]
  if (currentVal && !options.some((o) => o.value === currentVal)) {
    options.push({ value: currentVal, label: `${currentVal} (Custom)` })
  }
  return options
}

export const WhatsAppAiConfigPage = () => {
  const [formState, setFormState] = useState<WhatsAppAiConfig>({
    whatsapp_phone_number_id: "",
    whatsapp_access_token: "",
    whatsapp_verify_token: "",
    admin_whatsapp_phone: "",
    gemini_api_key: "",
    gemini_model: "gemini-3.5-flash-lite",
    text_model: "gemma-4-31b-it",
    storefront_url: "http://localhost:3000",
    vendor_url: "http://localhost:7001",
  })

  const [showAccessToken, setShowAccessToken] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const { data, isLoading, refetch } = useQuery<{ config: WhatsAppAiConfig }>({
    queryKey: ["whatsapp-ai-config"],
    queryFn: () => fetchQuery("/admin/whatsapp-config", { method: "GET" }),
  })

  useEffect(() => {
    if (data?.config) {
      setFormState((prev) => ({
        ...prev,
        ...data.config,
      }))
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (values: WhatsAppAiConfig) =>
      fetchQuery("/admin/whatsapp-config", {
        method: "POST",
        body: values,
      }),
    onSuccess: (res: any) => {
      toast.success(res?.message || "Configuration saved to database successfully")
      refetch()
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save configuration")
    },
  })

  const handleChange = (field: keyof WhatsAppAiConfig, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formState)
  }

  const isConfiguredInDb = Boolean(
    formState.whatsapp_phone_number_id ||
    formState.whatsapp_access_token ||
    formState.gemini_api_key
  )

  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"
  const webhookCallbackUrl = `${currentOrigin}/hooks/whatsapp`

  return (
    <SingleColumnPage hasOutlet={false}>
      <div className="flex flex-col gap-y-6 max-w-4xl pb-12">
        {/* Header Section */}
        <Container className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-x-3 mb-1">
                <Heading level="h1" className="text-xl font-semibold">
                  WhatsApp & AI Configuration
                </Heading>
                {isConfiguredInDb ? (
                  <StatusBadge color="green">Active in Database</StatusBadge>
                ) : (
                  <StatusBadge color="orange">Using Environment Fallback</StatusBadge>
                )}
              </div>
              <Text className="text-ui-fg-subtle text-sm">
                Manage WhatsApp Cloud API credentials, Google Gemini vision models, and webhook configuration stored directly in your database.
              </Text>
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <ArrowPath className={isLoading ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleSubmit}
                isLoading={mutation.isPending}
              >
                <CheckCircle />
                Save Configuration
              </Button>
            </div>
          </div>
        </Container>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          {/* WhatsApp Cloud API Configuration */}
          <Container className="divide-y p-0">
            <div className="p-6">
              <div className="flex items-center gap-x-2 mb-1">
                <Key className="text-ui-fg-muted" />
                <Heading level="h2" className="text-base font-semibold">
                  Meta WhatsApp Cloud API
                </Heading>
              </div>
              <Text className="text-ui-fg-subtle text-xs">
                Credentials from your Meta for Developers App (WhatsApp Product Settings).
              </Text>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Phone Number ID
                </Text>
                <Input
                  value={formState.whatsapp_phone_number_id || ""}
                  onChange={(e) => handleChange("whatsapp_phone_number_id", e.target.value)}
                  placeholder="e.g. 109283746501928"
                />
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Found under WhatsApp &gt; API Setup in Meta App Dashboard.
                </Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Admin WhatsApp Phone
                </Text>
                <Input
                  value={formState.admin_whatsapp_phone || ""}
                  onChange={(e) => handleChange("admin_whatsapp_phone", e.target.value)}
                  placeholder="e.g. 9782077711 (10-digit number)"
                />
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  10-digit mobile number without 91 or + prefix.
                </Text>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Text size="small" weight="plus">
                    Access Token
                  </Text>
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="text-xs text-ui-fg-interactive flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {showAccessToken ? <EyeSlash /> : <Eye />}
                    {showAccessToken ? "Hide" : "Reveal Token"}
                  </button>
                </div>
                <Input
                  type={showAccessToken ? "text" : "password"}
                  value={formState.whatsapp_access_token || ""}
                  onChange={(e) => handleChange("whatsapp_access_token", e.target.value)}
                  placeholder="EAABw..."
                />
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  System User permanent access token with whatsapp_business_messaging permissions.
                </Text>
              </div>

              <div className="md:col-span-2">
                <Text size="small" weight="plus" className="mb-2 block">
                  Webhook Verification Token
                </Text>
                <Input
                  value={formState.whatsapp_verify_token || ""}
                  onChange={(e) => handleChange("whatsapp_verify_token", e.target.value)}
                  placeholder="Custom secret token string (e.g. factorytribe_wa_secret_2026)"
                />
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Custom token string entered into Meta App Dashboard Webhook Configuration.
                </Text>
              </div>
            </div>

            {/* Webhook Configuration Quick Card */}
            <div className="p-6 bg-ui-bg-subtle/40">
              <Text size="small" weight="plus" className="mb-1">
                Webhook Callback Setup
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle mb-3">
                Paste these into your Meta WhatsApp App Dashboard under Configuration &gt; Webhook:
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-ui-bg-base border border-ui-border-base rounded-md">
                  <div>
                    <Text size="xsmall" className="text-ui-fg-muted">Callback URL</Text>
                    <Text size="small" className="font-mono text-xs">{webhookCallbackUrl}</Text>
                  </div>
                  <Copy content={webhookCallbackUrl} />
                </div>
                <div className="flex items-center justify-between p-3 bg-ui-bg-base border border-ui-border-base rounded-md">
                  <div>
                    <Text size="xsmall" className="text-ui-fg-muted">Verify Token</Text>
                    <Text size="small" className="font-mono text-xs">{formState.whatsapp_verify_token || "Not configured"}</Text>
                  </div>
                  {formState.whatsapp_verify_token && <Copy content={formState.whatsapp_verify_token} />}
                </div>
              </div>
            </div>
          </Container>

          {/* AI & Gemini Configuration */}
          <Container className="divide-y p-0">
            <div className="p-6">
              <Heading level="h2" className="text-base font-semibold mb-1">
                Google Gemini & Gemma AI Models
              </Heading>
              <Text className="text-ui-fg-subtle text-xs">
                Configure multimodal vision extraction and conversational merchandising models.
              </Text>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Text size="small" weight="plus">
                    Google Gemini API Key
                  </Text>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs text-ui-fg-interactive flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {showApiKey ? <EyeSlash /> : <Eye />}
                    {showApiKey ? "Hide" : "Reveal Key"}
                  </button>
                </div>
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={formState.gemini_api_key || ""}
                  onChange={(e) => handleChange("gemini_api_key", e.target.value)}
                  placeholder="AIzaSy..."
                />
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Obtained from Google AI Studio (aistudio.google.com).
                </Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Vision / Multimodal Model (Step 1)
                </Text>
                <Select
                  value={formState.gemini_model || "gemini-3.5-flash-lite"}
                  onValueChange={(val) => handleChange("gemini_model", val)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {getModelOptions(formState.gemini_model).map((model) => (
                      <Select.Item key={model.value} value={model.value}>
                        {model.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Model used for analyzing product photos and extracting specifications.
                </Text>
              </div>

              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Conversational & Editor Model (Step 2)
                </Text>
                <Select
                  value={formState.text_model || "gemma-4-31b-it"}
                  onValueChange={(val) => handleChange("text_model", val)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {getModelOptions(formState.text_model).map((model) => (
                      <Select.Item key={model.value} value={model.value}>
                        {model.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
                <Text size="xsmall" className="text-ui-fg-muted mt-1">
                  Model used for WhatsApp chat dialogues, intent parsing, and product revisions.
                </Text>
              </div>
            </div>
          </Container>

          {/* Storefront & Vendor URLs */}
          <Container className="divide-y p-0">
            <div className="p-6">
              <Heading level="h2" className="text-base font-semibold mb-1">
                Portal & Links Configuration
              </Heading>
              <Text className="text-ui-fg-subtle text-xs">
                Base URLs used when generating live product and vendor dashboard links in WhatsApp messages.
              </Text>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Storefront URL
                </Text>
                <Input
                  value={formState.storefront_url || ""}
                  onChange={(e) => handleChange("storefront_url", e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>

              <div>
                <Text size="small" weight="plus" className="mb-2 block">
                  Vendor Portal URL
                </Text>
                <Input
                  value={formState.vendor_url || ""}
                  onChange={(e) => handleChange("vendor_url", e.target.value)}
                  placeholder="http://localhost:7001"
                />
              </div>
            </div>
          </Container>

          {/* Save Action Footer */}
          <div className="flex items-center justify-end gap-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (data?.config) setFormState(data.config)
              }}
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={mutation.isPending}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </SingleColumnPage>
  )
}
