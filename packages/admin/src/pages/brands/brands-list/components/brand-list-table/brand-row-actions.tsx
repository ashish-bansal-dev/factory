import { BrandDTO, BrandStatus } from "@mercurjs/types"
import { CheckCircle, Trash, XCircle, PencilSquare } from "@medusajs/icons"
import { DropdownMenu, IconButton, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "@components/common/action-menu"
import { useApproveBrand, useDeleteBrand, useRejectBrand } from "@hooks/api/brands"

export const BrandRowActions = ({ brand }: { brand: BrandDTO }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

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

  return (
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
  )
}
