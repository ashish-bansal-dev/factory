import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FileType, FileUpload } from "@components/common/file-upload"
import { Form } from "@components/common/form"
import { HandleInput } from "@components/inputs/handle-input"
import { Combobox } from "@components/inputs/combobox"
import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useCreateBrand } from "@hooks/api/brands"
import { useComboboxData } from "@hooks/use-combobox-data"
import { sdk } from "@lib/client"
import { CreateBrandSchema, CreateBrandSchemaType } from "./schema"

const ALLOWED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]

export const CreateBrandForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  const form = useForm<CreateBrandSchemaType>({
    defaultValues: {
      name: "",
      handle: "",
      description: "",
      logo: "",
      banner: "",
      website_url: "",
      seller_ids: [],
    },
    resolver: zodResolver(CreateBrandSchema),
  })

  const sellers = useComboboxData({
    queryKey: ["sellers"],
    queryFn: (params) => sdk.admin.sellers.query(params),
    getOptions: (data) =>
      data.sellers.map((seller: { id: string; name: string }) => ({
        label: seller.name,
        value: seller.id,
      })),
  })

  const { mutateAsync, isPending } = useCreateBrand()

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let finalLogo: string | null = null
      let finalBanner: string | null = null

      if (logoFile) {
        const uploaded = await sdk.admin.uploads.mutate({
          files: [logoFile],
        })
        finalLogo = uploaded.files?.[0]?.url || null
      }

      if (bannerFile) {
        const uploaded = await sdk.admin.uploads.mutate({
          files: [bannerFile],
        })
        finalBanner = uploaded.files?.[0]?.url || null
      }

      const { brand } = await mutateAsync({
        name: data.name,
        handle: data.handle?.trim() || undefined,
        description: data.description?.trim() || null,
        logo: finalLogo,
        banner: finalBanner,
        website_url: data.website_url?.trim() || null,
        seller_ids: data.seller_ids?.length ? data.seller_ids : undefined,
      })

      handleSuccess(`/brands/${brand.id}`)
      toast.success("Brand created successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex size-full flex-col items-center overflow-auto p-16">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <Heading>Create Brand</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                Add a new brand to the marketplace and assign sellers.
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.name")}</Form.Label>
                      <Form.Control>
                        <Input autoComplete="off" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.handle")}</Form.Label>
                      <Form.Control>
                        <HandleInput {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-y-2">
                <Form.Label optional>Logo</Form.Label>
                <FileUpload
                  label="Upload Logo"
                  hint="PNG, JPG, WebP, SVG up to 10MB"
                  multiple={false}
                  formats={ALLOWED_IMAGE_FORMATS}
                  uploadedImage={logoUrl}
                  onUploaded={(files: FileType[]) => {
                    if (files.length > 0) {
                      setLogoFile(files[0].file)
                      setLogoUrl(files[0].url)
                    }
                  }}
                  onRemove={() => {
                    setLogoFile(null)
                    setLogoUrl(null)
                  }}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Form.Label optional>Banner</Form.Label>
                <FileUpload
                  label="Upload Banner"
                  hint="PNG, JPG, WebP, SVG up to 10MB"
                  multiple={false}
                  formats={ALLOWED_IMAGE_FORMATS}
                  uploadedImage={bannerUrl}
                  onUploaded={(files: FileType[]) => {
                    if (files.length > 0) {
                      setBannerFile(files[0].file)
                      setBannerUrl(files[0].url)
                    }
                  }}
                  onRemove={() => {
                    setBannerFile(null)
                    setBannerUrl(null)
                  }}
                />
              </div>
            </div>

            <Form.Field
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.website")}</Form.Label>
                  <Form.Control>
                    <Input placeholder="https://..." {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="seller_ids"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>Assigned Sellers</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      value={field.value ?? []}
                      options={sellers.options}
                      searchValue={sellers.searchValue}
                      onSearchValueChange={sellers.onSearchValueChange}
                      fetchNextPage={sellers.fetchNextPage}
                      placeholder="Select sellers to assign to this brand"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            variant="primary"
            type="submit"
            isLoading={isPending}
          >
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
