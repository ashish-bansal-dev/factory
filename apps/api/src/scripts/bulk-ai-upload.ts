import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"
import { BulkAiUploader } from "../services/bulk-ai-upload/bulk-ai-uploader"

/**
 * Medusa Exec script for Bulk AI Upload:
 * Usage:
 *   bun medusa exec ./src/scripts/bulk-ai-upload.ts -- --seller=<SELLER_ID> <image1.jpg> <image2.png> ...
 * Or if --dir is provided:
 *   bun medusa exec ./src/scripts/bulk-ai-upload.ts -- --seller=<SELLER_ID> --dir=/path/to/folder
 */
export default async function bulkAiUpload({ container, args }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  console.log("Starting Bulk AI Upload...")

  let sellerId: string | undefined
  let dirPath: string | undefined
  let notes: string | undefined
  const filePaths: string[] = []

  // Parse args
  for (const arg of args || []) {
    if (arg.startsWith("--seller=")) {
      sellerId = arg.replace("--seller=", "").trim()
    } else if (arg.startsWith("--dir=")) {
      dirPath = arg.replace("--dir=", "").trim()
    } else if (arg.startsWith("--notes=")) {
      notes = arg.replace("--notes=", "").trim()
    } else if (!arg.startsWith("--")) {
      filePaths.push(arg)
    }
  }

  // If no seller specified, pick the first active seller in the database
  if (!sellerId) {
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "handle"],
      pagination: { skip: 0, take: 5 },
    })

    if (!sellers || sellers.length === 0) {
      console.error("Error: No sellers found in database. Please specify --seller=<SELLER_ID>")
      return
    }
    sellerId = sellers[0].id
    console.log(`No --seller specified. Defaulting to first vendor: ${sellers[0].name} (${sellerId})`)
  }

  // If dir provided, read all image files from dir
  if (dirPath && fs.existsSync(dirPath)) {
    const entries = fs.readdirSync(dirPath)
    for (const file of entries) {
      const ext = path.extname(file).toLowerCase()
      if ([".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext)) {
        filePaths.push(path.join(dirPath, file))
      }
    }
  }

  if (filePaths.length === 0) {
    console.error("Error: No image files provided. Pass paths to images or --dir=<directory>")
    return
  }

  console.log(`Processing ${filePaths.length} image(s) for vendor ${sellerId}:`)
  filePaths.forEach((f) => console.log(`  - ${f}`))

  const imageBuffers: Array<{ buffer: Buffer; mimeType: string; originalName: string }> = []
  for (const filePath of filePaths) {
    const resolvedPath = path.resolve(filePath)
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`File not found, skipping: ${resolvedPath}`)
      continue
    }
    const ext = path.extname(resolvedPath).toLowerCase()
    let mimeType = "image/jpeg"
    if (ext === ".png") mimeType = "image/png"
    if (ext === ".webp") mimeType = "image/webp"

    const buffer = fs.readFileSync(resolvedPath)
    imageBuffers.push({
      buffer,
      mimeType,
      originalName: path.basename(resolvedPath),
    })
  }

  if (imageBuffers.length === 0) {
    console.error("No valid image files could be read.")
    return
  }

  const uploader = new BulkAiUploader(container)
  try {
    const result = await uploader.processBatch({
      sellerId,
      images: imageBuffers,
      notes,
    })

    console.log("-----------------------------------------")
    console.log("🎉 Bulk AI Upload Successful!")
    console.log(`• Article / Title: ${result.product.title}`)
    console.log(`• Product ID:      ${result.product.id}`)
    console.log(`• Handle:          ${result.product.handle}`)
    console.log(`• Status:          ${result.product.status}`)
    console.log(`• Brand:           ${result.brandName || "None"}`)
    console.log(`• Images Uploaded: ${result.imageUrls.length}`)
    console.log("-----------------------------------------")
  } catch (err: any) {
    console.error("❌ Bulk AI Upload failed:", err.message)
  }
}
