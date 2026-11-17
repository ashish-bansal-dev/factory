import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  uploadFilesWorkflow,
  linkProductsToSalesChannelWorkflow,
  createProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  createProductsWorkflow,
  createBrandWorkflow,
  linkProductBrandWorkflow,
  ProductWorkflowEvents,
} from "@mercurjs/core/workflows"
import { BrandStatus } from "@mercurjs/types"
import { GeminiVisionService } from "../whatsapp/gemini-vision"
import { ImageCompressor } from "../whatsapp/image-compressor"
import { ExtractedProduct } from "../whatsapp/types"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export interface BulkAiUploadInput {
  sellerId: string
  images: Array<{
    buffer: Buffer
    mimeType?: string
    originalName?: string
  }>
  notes?: string | string[]
}

export interface BulkAiUploadResult {
  product: {
    id: string
    title: string
    handle: string
    description?: string | null
    thumbnail?: string | null
    status: string
  }
  extracted: ExtractedProduct
  brandId?: string
  brandName?: string
  imageUrls: string[]
}

export class BulkAiUploader {
  private container: MedusaContainer
  private vision: GeminiVisionService
  private compressor: ImageCompressor

  constructor(container: MedusaContainer, apiKey?: string, model?: string) {
    this.container = container
    this.vision = new GeminiVisionService(apiKey, model)
    this.compressor = new ImageCompressor({
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 82,
      format: "webp",
    })
  }

  /**
   * Fetches all registered brands in the marketplace.
   */
  async getExistingBrands(): Promise<Array<{ id: string; name: string }>> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: brands } = await query.graph({
        entity: "brand",
        fields: ["id", "name", "handle"],
        pagination: { skip: 0, take: 200 },
      })
      return (brands || []).map((b: any) => ({ id: b.id, name: b.name }))
    } catch {
      return []
    }
  }

  /**
   * Resolves existing brand strictly against registered brands in the database.
   * Per user requirement: DOES NOT auto-create brands. Returns null if missing.
   */
  async resolveExistingBrand(brandName: string): Promise<{ id: string; name: string } | null> {
    const clean = brandName.trim()
    if (!clean) return null

    const handle = slugify(clean)
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    try {
      const { data: existingBrands } = await query.graph({
        entity: "brand",
        fields: ["id", "name", "handle"],
        pagination: { skip: 0, take: 200 },
      })

      const match = existingBrands?.find(
        (b: any) =>
          b.name?.toLowerCase() === clean.toLowerCase() ||
          b.handle?.toLowerCase() === handle ||
          b.name?.toLowerCase().includes(clean.toLowerCase()) ||
          clean.toLowerCase().includes(b.name?.toLowerCase())
      )
      if (match) {
        return { id: match.id, name: match.name }
      }
    } catch (queryErr: any) {
      console.warn("[BulkAiUploader] Warning querying brands:", queryErr.message)
    }

    return null
  }

  /**
   * Resolves category names to existing system product_category IDs.
   */
  async resolveSystemCategories(categoryNames: string[]): Promise<string[]> {
    if (!categoryNames || categoryNames.length === 0) return []
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    try {
      const { data: categories } = await query.graph({
        entity: "product_category",
        fields: ["id", "name", "handle"],
        pagination: { skip: 0, take: 200 },
      })
      const resolvedIds: string[] = []
      for (const rawName of categoryNames) {
        const clean = rawName.trim().toLowerCase()
        if (!clean) continue
        const match = categories?.find(
          (c: any) =>
            c.name?.toLowerCase() === clean ||
            c.handle?.toLowerCase() === slugify(clean) ||
            c.name?.toLowerCase().includes(clean)
        )
        if (match && !resolvedIds.includes(match.id)) {
          resolvedIds.push(match.id)
        }
      }
      return resolvedIds
    } catch {
      return []
    }
  }

  /**
   * Processes a single product batch of images (e.g. 1-3 photos of one article).
   * OMITTING default variant creation per user request: product is created with variants: [].
   */
  async processBatch(input: BulkAiUploadInput): Promise<BulkAiUploadResult> {
    const { sellerId, images, notes } = input

    if (!images || images.length === 0) {
      throw new Error("At least one product image is required for bulk AI upload.")
    }

    if (!sellerId) {
      throw new Error("sellerId is required to associate the product with a vendor.")
    }

    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)

    // Verify vendor exists
    const { data: sellers } = await query.graph({
      entity: "seller",
      fields: ["id", "name", "handle"],
      filters: { id: sellerId },
    })

    if (!sellers || sellers.length === 0) {
      throw new Error(`Vendor with ID "${sellerId}" not found.`)
    }
    const seller = sellers[0]

    // 1. Compress all images to WebP format
    console.log(`[BulkAiUploader] Compressing ${images.length} image(s) to WebP...`)
    const compressedImages = await this.compressor.compressBatch(images)

    // 2. Multimodal AI Extraction in a single pass with existing brand grounding
    console.log(`[BulkAiUploader] Feeding ${compressedImages.length} compressed image(s) to AI in single pass...`)
    const existingBrands = await this.getExistingBrands()
    const existingBrandNames = existingBrands.map((b) => b.name)

    const extracted = await this.vision.extractProductDetails(
      compressedImages.map((c) => ({ buffer: c.buffer, mimeType: c.mimeType })),
      notes,
      undefined,
      existingBrandNames
    )

    const articleTitle = extracted.article_number || extracted.title || "Untitled Product"
    console.log(`[BulkAiUploader] AI extracted Article/Title: "${articleTitle}", Brand: "${extracted.brand || "None"}"`)

    // 3. Upload compressed WebP images to storage
    let imageUrls: string[] = []
    try {
      const uploadInput = compressedImages.map((img, idx) => {
        const timestamp = Date.now()
        return {
          filename: `products/${sellerId}/${timestamp}_${idx + 1}.webp`,
          mimeType: "image/webp",
          content: img.buffer.toString("base64"),
          access: "public" as const,
        }
      })

      const { result: uploadedFiles } = await uploadFilesWorkflow(this.container).run({
        input: { files: uploadInput },
      })
      imageUrls = (uploadedFiles as Array<{ url: string }>).map((f) => f.url)
    } catch (uploadErr: any) {
      console.warn("[BulkAiUploader] Upload workflow warning, using static URL fallback:", uploadErr.message)
      imageUrls = compressedImages.map((_, idx) => {
        return `http://localhost:9000/static/product_${sellerId}_${Date.now()}_${idx + 1}.webp`
      })
    }

    // 4. Resolve Brand strictly from existing brands (do not auto-create)
    let brandId: string | undefined
    let brandName: string | undefined
    if (extracted.brand) {
      const resolvedBrand = await this.resolveExistingBrand(extracted.brand)
      if (resolvedBrand) {
        brandId = resolvedBrand.id
        brandName = resolvedBrand.name
      }
    }

    // 5. Resolve multiple Categories
    const categoryNamesToResolve = [
      ...(extracted.category_names || []),
      ...(extracted.category_name ? [extracted.category_name] : []),
    ]
    const resolvedCategoryIds = await this.resolveSystemCategories(categoryNamesToResolve)

    // 6. Query active sales channels
    let salesChannels: Array<{ id: string }> = []
    try {
      const { data } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
        filters: { is_disabled: false },
      })
      salesChannels = data || []
    } catch (scErr: any) {
      console.warn("[BulkAiUploader] Warning fetching sales channels:", scErr.message)
    }

    // 7. Product payload - OMITTING variant creation per user requirement (variants: [])
    const productPayload: any = {
      title: articleTitle,
      subtitle: extracted.subtitle || "",
      description: extracted.description || "",
      status: ProductStatus.PUBLISHED,
      thumbnail: imageUrls[0] || null,
      images: imageUrls.map((url) => ({ url })),
      seller_ids: [sellerId],
      sales_channels: salesChannels.map((sc) => ({ id: sc.id })),
      variants: [], // Omitted per user instruction for browse-only catalog
      metadata: {
        listing_scope: "global",
        created_via: "bulk_ai_upload",
        article_number: articleTitle,
        mrp: extracted.mrp,
        wholesale_unit_price: extracted.wholesale_price,
        suggested_retail_price: extracted.suggested_price,
        material: extracted.material,
        brand_name: brandName || extracted.brand || undefined,
        category_name: extracted.category_name || undefined,
        category_names: extracted.category_names || undefined,
      },
    }

    if (resolvedCategoryIds.length > 0) {
      productPayload.category_ids = resolvedCategoryIds
    }

    if (brandId) {
      productPayload.brand_id = brandId
    }

    console.log(`[BulkAiUploader] Creating product in database for vendor ${seller.name} (${sellerId})...`)
    const { result } = await createProductsWorkflow(this.container).run({
      input: {
        products: [productPayload],
        created_by: sellerId,
      },
    })

    const createdId = (result as { id: string }[])[0].id

    // Explicitly link brand if resolved
    if (brandId) {
      try {
        await linkProductBrandWorkflow(this.container).run({
          input: {
            id: createdId,
            add: [brandId],
          },
        })
      } catch (brandErr: any) {
        console.warn("[BulkAiUploader] Brand link notice:", brandErr.message)
      }
    }

    // Explicitly link to all sales channels to ensure immediate wholesale catalog and search visibility
    if (salesChannels.length > 0) {
      for (const sc of salesChannels) {
        try {
          await linkProductsToSalesChannelWorkflow(this.container).run({
            input: {
              id: sc.id,
              add: [createdId],
            },
          })
        } catch {
          // Ignore if already linked
        }
      }
    }

    // Retrieve created product record
    const {
      data: [createdProduct],
    } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "status", "description", "thumbnail"],
      filters: { id: createdId },
    })

    console.log(`[BulkAiUploader] Successfully created product: ${createdProduct.title} (${createdProduct.id})`)

    return {
      product: createdProduct,
      extracted,
      brandId,
      brandName,
      imageUrls,
    }
  }

  /**
   * Processes an array of multiple photos (e.g. 50 photos) where each photo is an individual
   * article/product for the selected vendor.
   * Compresses all images to WebP, uploads them, and calls Gemini Vision in single pass (1 API call),
   * then creates and publishes all products without default variants.
   */
  async processBulkImages(input: {
    sellerId: string
    images: Array<{ buffer: Buffer; mimeType?: string; originalName?: string }>
    notes?: string | string[]
    onProgress?: (progress: { current: number; total: number; lastProduct?: any }) => Promise<void> | void
  }): Promise<BulkAiUploadResult[]> {
    const { sellerId, images, notes, onProgress } = input
    if (!images || images.length === 0) {
      throw new Error("At least one product image is required")
    }
    if (!sellerId) {
      throw new Error("sellerId is required")
    }

    const results: BulkAiUploadResult[] = []
    console.log(`[BulkAiUploader] processBulkImages: Starting single-pass bulk upload of ${images.length} photos for vendor ${sellerId}...`)

    // 1. Compress all images to WebP
    const compressedImages: Array<{ buffer: Buffer; mimeType: string }> = []
    for (const img of images) {
      const comp = await this.compressor.compress(img.buffer)
      compressedImages.push({ buffer: comp.buffer, mimeType: comp.mimeType })
    }

    // 2. Upload all images to Medusa File Service (or fallback URLs)
    let imageUrls: string[] = []
    try {
      const uploadInput = compressedImages.map((img, idx) => ({
        filename: `bulk-ai-upload/${sellerId}/${Date.now()}_img_${idx + 1}.webp`,
        mimeType: img.mimeType,
        content: img.buffer.toString("base64"),
        access: "public" as const,
      }))
      const { result: uploadedFiles } = await uploadFilesWorkflow(this.container).run({
        input: { files: uploadInput },
      })
      imageUrls = (uploadedFiles as Array<{ url: string }>).map((f) => f.url)
    } catch (uploadErr: any) {
      console.warn("[BulkAiUploader] Bulk file upload workflow warning (using fallback):", uploadErr.message)
      imageUrls = compressedImages.map((_, idx) => `http://localhost:9000/static/bulk_${Date.now()}_${idx + 1}.webp`)
    }

    // 3. Single-Pass Multimodal Extraction (1 API call via extractBatchProducts grounded with existing brands)
    let batchExtracted: ExtractedProduct[] = []
    const existingBrands = await this.getExistingBrands()
    const existingBrandNames = existingBrands.map((b) => b.name)

    try {
      const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
      let availableCategoryNames: string[] = []
      try {
        const { data: categories } = await query.graph({
          entity: "product_category",
          fields: ["name"],
        })
        availableCategoryNames = (categories || []).map((c: any) => c.name)
      } catch {}

      batchExtracted = await this.vision.extractBatchProducts(compressedImages, notes, availableCategoryNames, existingBrandNames)
    } catch (batchAiErr: any) {
      console.warn("[BulkAiUploader] Single-pass batch vision failed, falling back to item extraction:", batchAiErr.message)
    }

    // 4. Create products for each image from the single-pass extraction
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    let salesChannels: Array<{ id: string }> = []
    try {
      const { data } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
        filters: { is_disabled: false },
      })
      salesChannels = data || []
    } catch {}

    for (let i = 0; i < images.length; i++) {
      try {
        let extracted = batchExtracted[i]
        if (!extracted) {
          try {
            console.log(`[BulkAiUploader] Missing batch extraction for image ${i + 1}, trying individual extraction...`)
            extracted = await this.vision.extractProductDetails(
              [compressedImages[i]],
              notes,
              availableCategoryNames,
              existingBrandNames
            )
          } catch (itemErr: any) {
            console.warn(`[BulkAiUploader] Individual extraction failed for image ${i + 1}:`, itemErr.message)
          }
        }

        if (!extracted) {
          console.warn(`[BulkAiUploader] Missing extraction for image ${i + 1}, using clean fallback`)
          extracted = {
            title: `Article ${i + 1}`,
            subtitle: "",
            description: "High quality wholesale product crafted with care.",
            category_name: "General",
            category_names: ["General"],
            currency_code: "inr",
            options: [],
            variants: [],
          }
        }

        const imgUrl = imageUrls[i] || `http://localhost:9000/static/bulk_${Date.now()}_${i + 1}.webp`
        const itemImageUrls = [imgUrl]

        // Resolve Brand strictly against existing brands (do not auto-create)
        let brandId: string | undefined
        let brandName: string | undefined
        if (extracted.brand) {
          const resolvedBrand = await this.resolveExistingBrand(extracted.brand)
          if (resolvedBrand) {
            brandId = resolvedBrand.id
            brandName = resolvedBrand.name
          }
        }

        // Resolve categories
        const catNames = extracted.category_names?.length
          ? extracted.category_names
          : extracted.category_name
          ? [extracted.category_name]
          : []
        const categoryIds = await this.resolveSystemCategories(catNames)

        const rawTitle = (extracted.title || "Untitled Product").trim()
        const baseSlug = slugify(rawTitle) || `product-${Date.now()}`
        const productHandle = `${baseSlug}-${Date.now().toString(36)}-${i + 1}`

        const createProductInput: any = {
          title: rawTitle,
          handle: productHandle,
          subtitle: extracted.subtitle || undefined,
          description: extracted.description || undefined,
          status: ProductStatus.PUBLISHED,
          images: itemImageUrls.map((url) => ({ url })),
          thumbnail: itemImageUrls[0],
          category_ids: categoryIds.length > 0 ? categoryIds : undefined,
          variants: [],
          metadata: {
            listing_scope: "global",
            created_via: "bulk_ai_upload",
            seller_id: sellerId,
            article_number: extracted.article_number || extracted.title,
            mrp: extracted.mrp,
            suggested_retail_price: extracted.suggested_price,
            wholesale_unit_price: extracted.wholesale_price,
            material: extracted.material,
            brand_name: brandName || extracted.brand || undefined,
            category_names: extracted.category_names || undefined,
          },
        }

        if (brandId) {
          createProductInput.brand_id = brandId
        }

        const { result } = await createProductsWorkflow(this.container).run({
          input: {
            products: [createProductInput],
            created_by: sellerId,
          },
        })

        const createdId = (result as { id: string }[])[0].id

        if (brandId) {
          try {
            await linkProductBrandWorkflow(this.container).run({
              input: { id: createdId, add: [brandId] },
            })
          } catch {}
        }

        if (salesChannels.length > 0) {
          for (const sc of salesChannels) {
            try {
              await linkProductsToSalesChannelWorkflow(this.container).run({
                input: { id: sc.id, add: [createdId] },
              })
            } catch {}
          }
        }

        const {
          data: [createdProduct],
        } = await query.graph({
          entity: "product",
          fields: ["id", "title", "handle", "status", "description", "thumbnail"],
          filters: { id: createdId },
        })

        const uploadResult: BulkAiUploadResult = {
          product: createdProduct,
          extracted,
          brandId,
          brandName,
          imageUrls: itemImageUrls,
        }

        results.push(uploadResult)

        if (onProgress) {
          await onProgress({
            current: i + 1,
            total: images.length,
            lastProduct: createdProduct,
          })
        }
      } catch (itemErr: any) {
        console.error(`[BulkAiUploader] Failed to process image ${i + 1}/${images.length}:`, itemErr.message)
      }
    }

    return results
  }
}
