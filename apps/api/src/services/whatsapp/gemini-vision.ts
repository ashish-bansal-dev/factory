import { ExtractedProduct } from "./types"

export const VISION_FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
]

export class GeminiVisionService {
  private apiKey?: string
  private model: string
  private aiInstance: any = null

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY
    this.model = model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
  }

  /**
   * Executes a model generation request with automatic failover across fallback models
   * in case of 503 high-demand, 404 deprecation, rate limit, or network timeout.
   */
  private async executeWithFallback(
    fn: (modelName: string) => Promise<any>
  ): Promise<any> {
    const candidateModels = [
      this.model,
      ...VISION_FALLBACK_MODELS.filter((m) => m !== this.model),
    ]

    let lastError: any = null
    for (const model of candidateModels) {
      try {
        return await fn(model)
      } catch (err: any) {
        lastError = err
        console.warn(
          `[GeminiVisionService] Model "${model}" failed (${err?.message || err}). Trying automatic fallback...`
        )
      }
    }

    throw lastError
  }

  private async getClient(): Promise<any> {
    if (this.aiInstance) {
      return this.aiInstance
    }

    if (!this.apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Please configure it in your environment."
      )
    }

    // Dynamic import to support ESM package in CommonJS runtime
    const { GoogleGenAI } = await import("@google/genai")
    this.aiInstance = new GoogleGenAI({ apiKey: this.apiKey })
    return this.aiInstance
  }

  private cleanJsonText(rawText?: string): string {
    if (!rawText) return "{}"
    let cleaned = rawText.trim()
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "")
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/i, "").replace(/\s*```$/, "")
    }
    return cleaned.trim()
  }

  /**
   * Analyzes one or more images, captions, and accompanying text messages using Gemini Vision
   * and extracts structured e-commerce product fields with article number, MRP, wholesale/retail pricing,
   * multi-select categories, and sizes/colors.
   */
  async extractProductDetails(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    captionsOrNotes?: string | string[],
    availableCategories?: string[],
    availableBrands?: string[]
  ): Promise<ExtractedProduct> {
    const ai = await this.getClient()

    const categoriesSection =
      availableCategories && availableCategories.length > 0
        ? `\nAvailable Store Categories (select ALL applicable categories from this list as multi-select):\n${availableCategories.map((c) => `- "${c}"`).join("\n")}\n`
        : ""

    const brandsSection =
      availableBrands && availableBrands.length > 0
        ? `\nExisting Marketplace Brands (assign ONLY from this list if detected; return null if not in this list or unbranded):\n${availableBrands.map((b) => `- "${b}"`).join("\n")}\n`
        : ""

    const systemPrompt = `You are an expert e-commerce catalog specialist and wholesale/retail merchandising assistant.
Analyze the provided product image(s), packaging, labels, shoe boxes, price tags, and all accompanying vendor messages/notes.
${categoriesSection}${brandsSection}
CRITICAL RULES:
1. ARTICLE NUMBER AS TITLE:
   - Carefully inspect shoe boxes, price tags, garment labels, stickers, invoices, or vendor messages for an Article Number, Style Code, Model No., or Item Code (e.g., "ART-502", "RX-101", "805", "CR-45", "Art No: 990").
   - Extract the clean code as "article_number" (e.g. "ART-502", "805").
   - Set "title" ALWAYS to this clean article number/code.
   - If no article number is found anywhere, fall back to a crisp descriptive title (e.g. 'Pure Linen Casual Shirt') and set article_number to null.

2. ASSIGN BRAND (EXISTING BRANDS ONLY):
   - Inspect the photo/box/label for the brand name.
   - If available brands are provided above, ONLY assign a brand if it matches one of the existing brands. If not in the list, unbranded, or generic, return null. Do NOT create or invent new brand names.

3. ASSIGN MRP FROM PHOTOS (OPTIONAL):
   - Carefully look at price tags, shoe box labels, barcodes, and MRP stickers for "M.R.P.", "MRP Rs.", "MRP: ₹...".
   - Extract the numerical MRP value into "mrp". If not detected on the photos or in text, return null.

4. SALE & WHOLESALE PRICING (OPTIONAL IF MISSING):
   - "suggested_price": Sale price / retail selling price if specifically stated in vendor notes or tags. Return null if not stated (do NOT default to MRP; keep it optional).
   - "wholesale_price": Wholesale unit price if mentioned in notes/caption. Return null if not mentioned (do NOT auto-calculate; keep it optional).
   All price fields (MRP, sale price, wholesale price) are strictly optional if missing.

5. MULTI-SELECT CATEGORIES:
   - Extract "category_names" as an ARRAY of ALL relevant categories that apply (multi-select), choosing from the available store categories if provided (e.g. ["Footwear", "Men", "Casual Shoes"]).
   - Also set "category_name" to the primary category name.

6. SIZES & COLORS:
   - Extract all detected sizes (e.g. ["6", "7", "8", "9", "10"] or ["S", "M", "L", "XL"]) and colors.

Extract the following JSON structure:
{
  "article_number": string or null (e.g. "ART-502" or "805"),
  "title": string (the article number, e.g. "ART-502", or fallback title if no article number exists),
  "subtitle": string ("Short 1-sentence highlight or slogan"),
  "description": string ("Engaging 2-3 paragraph product description highlighting materials, style, fit, and use cases"),
  "brand": string or null ("Brand name detected from labels, tags, emblems, logos, or caption. Return null if unbranded or generic"),
  "category_names": ["Array of applicable categories (multi-select)"],
  "category_name": string ("Primary category"),
  "material": string or null ("Material or fabric if visible or mentioned, e.g. 'Genuine Leather', 'EVA Sole', '100% Cotton'"),
  "sizes": ["Array of detected sizes, e.g. ['6', '7', '8', '9', '10'] or ['S', 'M', 'L']. Empty array if none"],
  "colors": ["Array of detected colors, e.g. ['Black', 'Tan']. Empty array if none"],
  "mrp": number or null (Numerical MRP from tag, sticker, shoe box, or note. Return null if missing),
  "suggested_price": number or null (Sale price if specified in notes/tag. Return null if missing),
  "wholesale_price": number or null (Wholesale unit price if specified. Return null if missing),
  "currency_code": "3-letter currency code in lowercase (default 'inr')",
  "options": [
    {
      "title": "e.g. 'Size' or 'Color'",
      "values": ["Array of detected option values"]
    }
  ]
}

Always output strict, valid JSON matching the schema.`

    const parts: any[] = [{ text: systemPrompt }]

    // Add captions or accompanying messages
    if (captionsOrNotes) {
      const notesList = Array.isArray(captionsOrNotes) ? captionsOrNotes : [captionsOrNotes]
      const cleanNotes = notesList.map((n) => n?.trim()).filter(Boolean)
      if (cleanNotes.length > 0) {
        parts.push({
          text: `Vendor notes and accompanying message(s):\n${cleanNotes.map((n) => `• "${n}"`).join("\n")}`,
        })
      }
    }

    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType || "image/jpeg",
          data: img.buffer.toString("base64"),
        },
      })
    }

    const response = await this.executeWithFallback((modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: parts,
        config: {
          responseMimeType: "application/json",
        },
      })
    )

    const text = response.text || "{}"
    try {
      const cleaned = this.cleanJsonText(text)
      const parsed = JSON.parse(cleaned) as Partial<ExtractedProduct>

      const mrp =
        typeof parsed.mrp === "number" && !isNaN(parsed.mrp)
          ? parsed.mrp
          : null

      const suggestedPrice =
        typeof parsed.suggested_price === "number" && !isNaN(parsed.suggested_price)
          ? parsed.suggested_price
          : null

      const wholesalePrice =
        typeof parsed.wholesale_price === "number" && !isNaN(parsed.wholesale_price)
          ? parsed.wholesale_price
          : null

      const categoryNames: string[] = Array.isArray(parsed.category_names)
        ? parsed.category_names.filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        : parsed.category_name
        ? [parsed.category_name]
        : []

      const articleNumber = parsed.article_number?.trim() || undefined
      const title = articleNumber || parsed.title?.trim() || "Untitled Product"

      return {
        article_number: articleNumber,
        title,
        subtitle: parsed.subtitle || "",
        description:
          parsed.description || "High quality product crafted with care.",
        brand: parsed.brand || undefined,
        category_name: categoryNames[0] || parsed.category_name,
        category_names: categoryNames,
        material: parsed.material,
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        mrp,
        suggested_price: suggestedPrice,
        wholesale_price: wholesalePrice,
        currency_code: (parsed.currency_code || "inr").toLowerCase(),
        options: Array.isArray(parsed.options) ? parsed.options : [],
      }
    } catch (err: any) {
      console.error(
        "[GeminiVisionService] Failed to parse JSON from Gemini response:",
        text
      )
      throw new Error(`Invalid JSON received from Gemini: ${err.message}`)
    }
  }

  /**
   * Analyzes an array of distinct product images in a single pass (1 API call)
   * where each image represents an individual product/article.
   * Returns an array of ExtractedProduct corresponding to each input image.
   */
  async extractBatchProducts(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    captionsOrNotes?: string | string[],
    availableCategories?: string[],
    availableBrands?: string[]
  ): Promise<ExtractedProduct[]> {
    if (!images.length) return []

    // If batch size is larger than 25, split into chunks of 25 to stay comfortably
    // within the model's 8,192 output token limit.
    const CHUNK_SIZE = 25
    if (images.length > CHUNK_SIZE) {
      const allResults: ExtractedProduct[] = []
      for (let i = 0; i < images.length; i += CHUNK_SIZE) {
        const chunk = images.slice(i, i + CHUNK_SIZE)
        const chunkResults = await this.extractBatchProducts(chunk, captionsOrNotes, availableCategories, availableBrands)
        allResults.push(...chunkResults)
      }
      return allResults
    }

    const ai = await this.getClient()

    const categoriesSection =
      availableCategories && availableCategories.length > 0
        ? `\nAvailable Store Categories (select applicable categories for each item):\n${availableCategories.map((c) => `- "${c}"`).join("\n")}\n`
        : ""

    const brandsSection =
      availableBrands && availableBrands.length > 0
        ? `\nExisting Marketplace Brands (assign ONLY from this list if detected; return null if not in this list or unbranded):\n${availableBrands.map((b) => `- "${b}"`).join("\n")}\n`
        : ""

    const systemPrompt = `You are an expert e-commerce catalog specialist and wholesale merchandising assistant.
You are given a batch of ${images.length} distinct product image(s).
EACH image corresponds to a separate, unique product or article.
${categoriesSection}${brandsSection}
CRITICAL RULES FOR EACH IMAGE (from index 0 to ${images.length - 1}):
1. ARTICLE NUMBER AS TITLE:
   - Carefully inspect shoe boxes, price tags, garment labels, stickers, or stamps for an Article Number or Style Code (e.g., "ART-502", "805", "RX-101").
   - Extract the clean code as "article_number" and set "title" to this clean code.
   - If no article number is found, write a crisp 2-4 word descriptive title.
2. DESCRIPTION:
   - Write a concise 1-2 sentence wholesale description for each product.
3. BRAND (EXISTING BRANDS ONLY):
   - If available brands are provided, ONLY assign a brand if it strictly matches one of the existing marketplace brands. If not in the list, unbranded, or generic, return null. Do NOT create or invent new brands.
4. CATEGORIES:
   - Extract "category_names" as an array of applicable store categories.
5. OPTIONAL PRICING:
   - "mrp": MRP number if printed on box/tag, else null.
   - "suggested_price": Retail sale price if stated, else null.
   - "wholesale_price": Wholesale unit price if stated, else null.

Return a STRICT JSON ARRAY of ${images.length} objects corresponding in exact order to Image 0 through Image ${images.length - 1}:
[
  {
    "image_index": 0,
    "article_number": "ART-502",
    "title": "ART-502",
    "subtitle": "Short highlight",
    "description": "Concise wholesale description",
    "brand": "Brand Name or null",
    "category_names": ["Category 1", "Category 2"],
    "category_name": "Category 1",
    "material": "Leather or null",
    "sizes": ["6", "7", "8"],
    "colors": ["Tan"],
    "mrp": null,
    "suggested_price": null,
    "wholesale_price": null,
    "currency_code": "inr"
  }
]
Output ONLY valid JSON array with ${images.length} items.`

    const parts: any[] = [{ text: systemPrompt }]

    if (captionsOrNotes) {
      const notesList = Array.isArray(captionsOrNotes) ? captionsOrNotes : [captionsOrNotes]
      const cleanNotes = notesList.map((n) => n?.trim()).filter(Boolean)
      if (cleanNotes.length > 0) {
        parts.push({
          text: `General batch notes:\n${cleanNotes.map((n) => `• "${n}"`).join("\n")}`,
        })
      }
    }

    images.forEach((img, idx) => {
      parts.push({ text: `--- Image ${idx} ---` })
      parts.push({
        inlineData: {
          mimeType: img.mimeType || "image/webp",
          data: img.buffer.toString("base64"),
        },
      })
    })

    const response = await this.executeWithFallback((modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      })
    )

    const text = response.text || "[]"
    try {
      const cleaned = this.cleanJsonText(text)
      const parsedData = JSON.parse(cleaned)
      let items: any[] = []
      if (Array.isArray(parsedData)) {
        items = parsedData
      } else if (parsedData && typeof parsedData === "object") {
        const arrayKey = Object.keys(parsedData).find((k) => Array.isArray(parsedData[k]))
        if (arrayKey) {
          items = parsedData[arrayKey]
        } else {
          items = [parsedData]
        }
      }

      // Map items by image_index if available, otherwise by sequential index
      const itemMap = new Map<number, any>()
      items.forEach((item, idx) => {
        const imgIdx = typeof item?.image_index === "number" ? item.image_index : idx
        itemMap.set(imgIdx, item)
      })

      return images.map((_, idx) => {
        const parsed = itemMap.get(idx) || items[idx] || {}
        const articleNumber = parsed.article_number?.trim() || undefined
        const title = articleNumber || parsed.title?.trim() || `Article ${idx + 1}`
        const categoryNames: string[] = Array.isArray(parsed.category_names)
          ? parsed.category_names.filter((c: any) => typeof c === "string" && c.trim().length > 0)
          : parsed.category_name
          ? [parsed.category_name]
          : []

        return {
          article_number: articleNumber,
          title,
          subtitle: parsed.subtitle || "",
          description: parsed.description || "High quality wholesale product crafted with care.",
          brand: parsed.brand || undefined,
          category_name: categoryNames[0] || parsed.category_name || "General",
          category_names: categoryNames.length > 0 ? categoryNames : ["General"],
          material: parsed.material || undefined,
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
          colors: Array.isArray(parsed.colors) ? parsed.colors : [],
          mrp: typeof parsed.mrp === "number" && !isNaN(parsed.mrp) ? parsed.mrp : null,
          suggested_price: typeof parsed.suggested_price === "number" && !isNaN(parsed.suggested_price) ? parsed.suggested_price : null,
          wholesale_price: typeof parsed.wholesale_price === "number" && !isNaN(parsed.wholesale_price) ? parsed.wholesale_price : null,
          currency_code: (parsed.currency_code || "inr").toLowerCase(),
          options: [],
          variants: [],
        }
      })
    } catch (err: any) {
      console.error("[GeminiVisionService] Failed to parse JSON array from Gemini:", text)
      throw new Error(`Invalid JSON array received from Gemini: ${err.message}`)
    }
  }
}
