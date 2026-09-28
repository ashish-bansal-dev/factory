import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { ArrowUpRightOnBox, CheckCircle, PencilSquare, Trash, XCircle } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "@components/common/action-menu"
import { Thumbnail } from "@components/common/thumbnail"
import { SectionRow } from "@components/common/section"
import { useApproveBrand, useDeleteBrand, useRejectBrand } from "@hooks/api/brands"

export const BrandGeneralSection = ({ brand }: { brand: BrandDTO }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { mutateAsync: deleteBrand } = useDeleteBrand(brand.id)
  const { mutateAsync: approveBrand } = useApproveBrand(brand.id)
  const { mutateAsync: rejectBrand } = useRejectBrand(brand.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: `Are you sure you want to delete brand "${brand.name}"?`,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    try {
      await deleteBrand()
      toast.success("Brand deleted successfully")
      navigate("/brands")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleApprove = async () => {
    try {
      await approveBrand()
      toast.success(`Brand "${brand.name}" approved successfully`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleReject = async () => {
    const res = await prompt({
      title: "Reject Brand",
      description: `Are you sure you want to reject brand request "${brand.name}"?`,
      confirmText: "Reject",
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    try {
      await rejectBrand()
      toast.success(`Brand "${brand.name}" rejected`)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const isPending = brand.status === BrandStatus.PENDING_APPROVAL
  const statusColor =
    brand.status === BrandStatus.APPROVED
      ? "green"
      : brand.status === BrandStatus.PENDING_APPROVAL
      ? "orange"
      : "red"

  const productsCount = brand.products?.length ?? 0
  const sellersCount = brand.sellers?.length ?? 0
  const formattedCreated = brand.created_at
    ? new Date(brand.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-"

  return (
    <Container className="divide-y p-0 overflow-hidden">
      {/* Brand Hero Cover */}
      {brand.banner ? (
        <div className="relative h-44 w-full overflow-hidden bg-ui-bg-subtle">
          <img
            src={brand.banner}
            alt={`${brand.name} banner`}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-r from-ui-bg-subtle via-ui-bg-component to-ui-bg-subtle border-b border-ui-border-base relative" />
      )}

      {/* Brand Header */}
      <div className="px-6 pb-6 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-x-4">
            <div className="-mt-10 relative shrink-0">
              <div className="size-20 rounded-xl border-2 border-ui-bg-base bg-ui-bg-base shadow-sm overflow-hidden flex items-center justify-center">
                <Thumbnail src={brand.logo ?? null} size="large" />
              </div>
            </div>
            <div className="pt-1">
              <div className="flex items-center gap-x-2.5">
                <Heading level="h1" className="text-xl font-semibold">
                  {brand.name}
                </Heading>
                <Badge size="2xsmall" color={statusColor} className="capitalize">
                  {brand.status?.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-x-3 mt-1">
                <span className="font-mono text-xs text-ui-fg-subtle">
                  {brand.handle ? `@${brand.handle}` : brand.id}
                </span>
                {brand.website_url && (
                  <>
                    <span className="text-ui-fg-muted text-xs">•</span>
                    <a
                      href={brand.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-x-1 text-xs text-ui-fg-interactive hover:underline"
                    >
                      {brand.website_url.replace(/^https?:\/\//, "")}
                      <ArrowUpRightOnBox className="size-3" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    onClick: () => navigate(`/brands/${brand.id}/edit`),
                  },
                  ...(isPending
                    ? [
                        {
                          icon: <CheckCircle className="text-ui-fg-interactive" />,
                          label: "Approve Brand",
                          onClick: handleApprove,
                        },
                        {
                          icon: <XCircle className="text-ui-fg-error" />,
                          label: "Reject Brand",
                          onClick: handleReject,
                        },
                      ]
                    : []),
                ],
              },
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-ui-border-base">
          <div className="rounded-lg bg-ui-bg-subtle p-3">
            <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
              Products
            </Text>
            <Text size="large" weight="plus" className="text-ui-fg-base mt-0.5">
              {productsCount}
            </Text>
          </div>
          <div className="rounded-lg bg-ui-bg-subtle p-3">
            <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
              Sellers
            </Text>
            <Text size="large" weight="plus" className="text-ui-fg-base mt-0.5">
              {sellersCount}
            </Text>
          </div>
          <div className="rounded-lg bg-ui-bg-subtle p-3">
            <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
              Status
            </Text>
            <Text size="base" weight="plus" className="text-ui-fg-base mt-0.5 capitalize">
              {brand.status?.replace(/_/g, " ")}
            </Text>
          </div>
          <div className="rounded-lg bg-ui-bg-subtle p-3">
            <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-medium">
              Created
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-base mt-1">
              {formattedCreated}
            </Text>
          </div>
        </div>
      </div>

      {/* Details Rows */}
      <SectionRow
        title={t("fields.description")}
        value={brand.description || "-"}
      />

      <SectionRow
        title={t("fields.handle")}
        value={
          <span className="font-mono text-xs text-ui-fg-subtle">
            {brand.handle ? `/${brand.handle}` : "-"}
          </span>
        }
      />

      <SectionRow
        title={t("fields.website")}
        value={
          brand.website_url ? (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-x-1 text-ui-fg-interactive hover:underline"
            >
              {brand.website_url}
              <ArrowUpRightOnBox className="size-3.5" />
            </a>
          ) : (
            "-"
          )
        }
      />
    </Container>
  )
}
