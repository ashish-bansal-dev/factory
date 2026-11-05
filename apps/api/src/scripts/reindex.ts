import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function reindex({ container }: ExecArgs) {
  const searchModuleService = container.resolve(Modules.SEARCH)
  console.log("Triggering reindex for product index...")
  const result = await searchModuleService.reindex({ index: "product" })
  console.log("Reindex completed successfully:", result)
}
