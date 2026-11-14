import { ExtractedProduct } from "./types"

export class GeminiVisionService {
  private apiKey?: string
  private model: string
  private aiInstance: any = null

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY
    this.model = model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
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

  /**
   * Analyzes one or more images, captions, and accompanying text messages using Gemini Vision
   * and extracts structured e-commerce product fields with article number, MRP, wholesale/retail pricing,
   * multi-select categories, and sizes/colors.
   */
  async extractProductDetails(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    captionsOrNotes?: string | string[],
    availableCategories?: string[]
  ): Promise<ExtractedProduct> {
    const ai = await this.getClient()

    const categoriesSection =
      availableCategories && availableCategories.length > 0
        ? `\nAvailable Store Categories (select ALL applicable categories from this list as multi-select):\n${availableCategories.map((c) => `- "${c}"`).join("\n")}\n`
        : ""

    const systemPrompt = `You are an expert e-commerce catalog specialist and wholesale/retail merchandising assistant.
Analyze the provided product image(s), packaging, labels, shoe boxes, price tags, and all accompanying vendor messages/notes.
${categoriesSection}
CRITICAL RULES:
1. ARTICLE NUMBER AS TITLE:
   - Carefully inspect shoe boxes, price tags, garment labels, stickers, invoices, or vendor messages for an Article Number, Style Code, Model No., or Item Code (e.g., "ART-502", "RX-101", "805", "CR-45", "Art No: 990").
   - Extract the clean code as "article_number" (e.g. "ART-502", "805").
   - Set "title" ALWAYS to this clean article number/code.
   - If no article number is found anywhere, fall back to a crisp descriptive title (e.g. 'Pure Linen Casual Shirt') and set article_number to null.

2. ASSIGN MRP FROM PHOTOS:
   - Carefully look at price tags, shoe box labels, barcodes, and MRP stickers for "M.R.P.", "MRP Rs.", "MRP: ₹...".
   - Extract the numerical MRP value into "mrp". If not detected on the photos or in text, set null.

3. RETAIL & WHOLESALE PRICING:
   - "suggested_price": Retail selling price. If a retail selling price or discount is mentioned in vendor notes, use it; otherwise if MRP is present, default to MRP.
   - "wholesale_price": Wholesale unit price. If a wholesale rate is mentioned in notes (e.g. "Wholesale 350", "WS 350", "Wholesale rate 400"), extract that number. If not mentioned but MRP is known, default wholesale unit price to 50% of MRP.

4. MULTI-SELECT CATEGORIES:
   - Extract "category_names" as an ARRAY of ALL relevant categories that apply (multi-select), choosing from the available store categories if provided (e.g. ["Footwear", "Men", "Casual Shoes"]).
   - Also set "category_name" to the primary category name.

5. SIZES & COLORS:
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
  "mrp": number or null (Numerical MRP from tag, sticker, shoe box, or note),
  "suggested_price": number or null (Retail selling price, defaults to MRP if not specified),
  "wholesale_price": number or null (Wholesale unit price, from note or 50% of MRP),
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

    const response = await ai.models.generateContent({
      model: this.model,
      contents: parts,
      config: {
        responseMimeType: "application/json",
      },
    })

    const text = response.text || "{}"
    try {
      const parsed = JSON.parse(text) as Partial<ExtractedProduct>

      const mrp =
        typeof parsed.mrp === "number" && !isNaN(parsed.mrp)
          ? parsed.mrp
          : null

      let suggestedPrice =
        typeof parsed.suggested_price === "number" && !isNaN(parsed.suggested_price)
          ? parsed.suggested_price
          : mrp

      let wholesalePrice =
        typeof parsed.wholesale_price === "number" && !isNaN(parsed.wholesale_price)
          ? parsed.wholesale_price
          : mrp != null
          ? Math.round(mrp * 0.5)
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
}
