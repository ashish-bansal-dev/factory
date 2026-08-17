import { useState } from "react"
import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { Button, Input, Select, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { FileType, FileUpload } from "@components/common/file-upload"
import { Form } from "@components/common/form"
import { HandleInput } from "@components/inputs/handle-input"
import { Combobox } from "@components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateBrand } from "@hooks/api/brands"
import { useComboboxData } from "@hooks/use-combobox-data"
import { sdk } from "@lib/client"
import { EditBrandSchema, EditBrandSchemaType } from "./schema"

const ALLOWED_IMAGE_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]

export const EditBrandForm = ({ brand }: { brand: BrandDTO }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(brand.logo ?? null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(brand.banner ?? null)

  const form = useForm<EditBrandSchemaType>({
    defaultValues: {
      name: brand.name ?? "",
      handle: brand.handle ?? "",
      description: brand.description ?? "",
      website_url: brand.website_url ?? "",
      status: (brand.status as BrandStatus) ?? BrandStatus.APPROVED,
      seller_ids: brand.sellers?.map((s) => s.id) ?? [],
    },
    resolver: zodResolver(EditBrandSchema),
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

  const { mutateAsync, isPending } = useUpdateBrand(brand.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      let finalLogo = logoUrl
      let finalBanner = bannerUrl

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

      await mutateAsync({
        name: data.name,
        handle: data.handle?.trim() || undefined,
        description: data.description?.trim() || null,
        logo: finalLogo,
        banner: finalBanner,
        website_url: data.website_url?.trim() || null,
        status: data.status,
        seller_ids: data.seller_ids,
      })

      handleSuccess()
      toast.success("Brand updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-y-6 p-6">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, value, ref: _ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("fields.status")}</Form.Label>
                  <Form.Control>
                    <Select {...field} value={value} onValueChange={onChange}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value={BrandStatus.APPROVED}>Approved</Select.Item>
                        <Select.Item value={BrandStatus.PENDING_APPROVAL}>Pending Approval</Select.Item>
                        <Select.Item value={BrandStatus.REJECTED}>Rejected</Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.handle")}</Form.Label>
                  <Form.Control>
                    <HandleInput {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

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
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
