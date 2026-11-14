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
   * Analyzes one or more images and an optional caption using Gemini 3.5 Flash Lite
   * and extracts structured e-commerce product fields.
   */
  async extractProductDetails(
    images: Array<{ buffer: Buffer; mimeType: string }>,
    caption?: string,
    availableCategories?: string[]
  ): Promise<ExtractedProduct> {
    const ai = await this.getClient()

    const categoriesSection =
      availableCategories && availableCategories.length > 0
        ? `\nAvailable Store Categories (strictly choose the best match from this list if applicable):\n${availableCategories.map((c) => `- "${c}"`).join("\n")}\n`
        : ""

    const systemPrompt = `You are an expert e-commerce catalog specialist and merchandising assistant.
Analyze the provided product image(s) and any vendor caption to extract rich, accurate product metadata.
${categoriesSection}
Extract the following JSON structure:
{
  "title": "A crisp, catchy product title (e.g. 'Pure Linen Casual Shirt')",
  "subtitle": "Short 1-sentence highlight or slogan",
  "description": "Engaging 2-3 paragraph product description highlighting materials, style, fit, and use cases",
  "brand": "Brand name detected from labels, tags, emblems, logos, or caption (e.g. 'Nike', 'FabIndia', 'Puma'). Return null if unbranded or generic.",
  "category_name": "Primary category (best match from available store categories if provided, e.g. 'Topwear', 'Footwear', 'Indian & Festive Wear', 'Apparel')",
  "material": "Material or fabric if visible or mentioned (e.g. '100% Linen', 'Genuine Leather', 'Stainless Steel')",
  "sizes": ["Array of detected sizes (e.g. ['S', 'M', 'L'] or ['40', '41', '42'] or ['Free Size']). Empty array if none."],
  "colors": ["Array of detected colors (e.g. ['Blue', 'Black'] or ['Beige']). Empty array if none."],
  "suggested_price": number or null (Extract price if shown in image tag/label or stated in caption. If unknown, return null),
  "currency_code": "3-letter currency code in lowercase (default 'inr', Indian Rupee ₹)",
  "options": [
    {
      "title": "e.g. 'Size' or 'Color'",
      "values": ["Array of detected option values, e.g. ['S', 'M', 'L'] or ['Beige', 'Navy']"]
    }
  ],
  "variants": [
    {
      "title": "Variant title corresponding to option (e.g. 'M / Beige' or 'Default')",
      "price": number (same as suggested_price if single price, or specific price if specified)
    }
  ]
}

If no sizes or variants are distinguishable, provide a single variant with title 'Default'.
Always output strict, valid JSON matching the schema.`

    const parts: any[] = [{ text: systemPrompt }]

    if (caption && caption.trim()) {
      parts.push({
        text: `Vendor note / caption: "${caption.trim()}"`,
      })
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

      return {
        title: parsed.title || "Untitled Product",
        subtitle: parsed.subtitle || "",
        description:
          parsed.description || "High quality product crafted with care.",
        brand: parsed.brand || undefined,
        category_name: parsed.category_name,
        material: parsed.material,
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        suggested_price:
          typeof parsed.suggested_price === "number" &&
          !isNaN(parsed.suggested_price)
            ? parsed.suggested_price
            : null,
        currency_code: (parsed.currency_code || "inr").toLowerCase(),
        options: Array.isArray(parsed.options) ? parsed.options : [],
        variants:
          Array.isArray(parsed.variants) && parsed.variants.length > 0
            ? parsed.variants
            : [
                {
                  title: "Default",
                  price: parsed.suggested_price ?? 0,
                },
              ],
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
