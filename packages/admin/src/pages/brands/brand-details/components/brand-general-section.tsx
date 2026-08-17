import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { Badge, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { CheckCircle, PencilSquare, Trash, XCircle } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "@components/common/action-menu"
import { Thumbnail } from "@components/common/thumbnail"
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

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-4">
          <Thumbnail src={brand.logo ?? null} size="large" />
          <div>
            <div className="flex items-center gap-x-2">
              <Heading>{brand.name}</Heading>
              <Badge size="2xsmall" color={statusColor} className="capitalize">
                {brand.status?.replace(/_/g, " ")}
              </Badge>
            </div>
            <Text size="small" className="text-ui-fg-subtle">
              {brand.handle ? `/${brand.handle}` : "-"}
            </Text>
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

      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" weight="plus">
          {t("fields.description")}
        </Text>
        <Text size="small">
          {brand.description || "-"}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" weight="plus">
          {t("fields.website")}
        </Text>
        <Text size="small">
          {brand.website_url ? (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-ui-fg-interactive hover:underline"
            >
              {brand.website_url}
            </a>
          ) : (
            "-"
          )}
        </Text>
      </div>
    </Container>
  )
}
