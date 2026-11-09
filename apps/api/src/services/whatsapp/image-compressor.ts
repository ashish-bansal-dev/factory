import sharp from "sharp"

export interface CompressedImage {
  buffer: Buffer
  mimeType: string
  width?: number
  height?: number
  originalSizeBytes: number
  compressedSizeBytes: number
  compressionRatio: string
}

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "jpeg" | "webp"
}

export class ImageCompressor {
  private maxWidth: number
  private maxHeight: number
  private quality: number
  private format: "jpeg" | "webp"

  constructor(options?: ImageCompressionOptions) {
    this.maxWidth = options?.maxWidth || 1600
    this.maxHeight = options?.maxHeight || 1600
    this.quality = options?.quality || 82
    this.format = options?.format || "webp"
  }

  /**
   * Compresses and optimizes an image buffer before cloud storage and AI vision ingestion.
   */
  async compress(inputBuffer: Buffer): Promise<CompressedImage> {
    const originalSize = inputBuffer.length

    try {
      let pipeline = sharp(inputBuffer)
        .rotate() // Automatically orient image using EXIF orientation tags

      // Fetch metadata to check dimensions
      const metadata = await pipeline.metadata()

      // Resize if dimensions exceed max bounds
      if (
        (metadata.width && metadata.width > this.maxWidth) ||
        (metadata.height && metadata.height > this.maxHeight)
      ) {
        pipeline = pipeline.resize({
          width: this.maxWidth,
          height: this.maxHeight,
          fit: "inside",
          withoutEnlargement: true,
        })
      }

      let compressedBuffer: Buffer
      let mimeType: string

      if (this.format === "webp") {
        compressedBuffer = await pipeline
          .webp({ quality: this.quality, effort: 4 })
          .toBuffer()
        mimeType = "image/webp"
      } else {
        // High quality optimized JPEG (mozjpeg for maximal compression)
        compressedBuffer = await pipeline
          .jpeg({ quality: this.quality, mozjpeg: true, progressive: true })
          .toBuffer()
        mimeType = "image/jpeg"
      }

      const compressedSize = compressedBuffer.length
      const savingsPct = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)

      console.log(
        `[ImageCompressor] ${(originalSize / 1024).toFixed(1)} KB ➔ ${(compressedSize / 1024).toFixed(1)} KB (-${savingsPct}%)`
      )

      return {
        buffer: compressedBuffer,
        mimeType,
        width: metadata.width,
        height: metadata.height,
        originalSizeBytes: originalSize,
        compressedSizeBytes: compressedSize,
        compressionRatio: `-${savingsPct}%`,
      }
    } catch (err: any) {
      console.warn(`[ImageCompressor] Compression fallback due to error: ${err.message}`)
      return {
        buffer: inputBuffer,
        mimeType: this.format === "webp" ? "image/webp" : "image/jpeg",
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        compressionRatio: "0%",
      }
    }
  }

  /**
   * Batch compresses an array of image buffers.
   */
  async compressBatch(
    images: Array<{ buffer: Buffer; mimeType?: string }>
  ): Promise<Array<{ buffer: Buffer; mimeType: string }>> {
    const results = await Promise.all(
      images.map(async (img) => {
        const compressed = await this.compress(img.buffer)
        return {
          buffer: compressed.buffer,
          mimeType: compressed.mimeType,
        }
      })
    )
    return results
  }
}
