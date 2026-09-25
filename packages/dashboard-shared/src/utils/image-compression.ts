export interface ImageCompressionOptions {
  maxDimension?: number
  quality?: number
  mimeType?: "image/webp" | "image/jpeg"
  minSizeToCompress?: number
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxDimension: 2048,
  quality: 0.85,
  mimeType: "image/webp",
  minSizeToCompress: 500 * 1024,
}

export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  if (typeof window === "undefined") {
    return file
  }

  const compressibleTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"]
  if (!compressibleTypes.includes(file.type)) {
    return file
  }

  const config = { ...DEFAULT_OPTIONS, ...options }

  if (file.size <= config.minSizeToCompress) {
    return file
  }

  try {
    let bitmap: ImageBitmap | HTMLImageElement

    if (typeof createImageBitmap === "function") {
      bitmap = await createImageBitmap(file)
    } else {
      bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          URL.revokeObjectURL(url)
          resolve(img)
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error("Failed to load image"))
        }
        img.src = url
      })
    }

    const { width, height } = bitmap

    let targetWidth = width
    let targetHeight = height

    if (width > config.maxDimension || height > config.maxDimension) {
      if (width > height) {
        targetWidth = config.maxDimension
        targetHeight = Math.round((height * config.maxDimension) / width)
      } else {
        targetHeight = config.maxDimension
        targetWidth = Math.round((width * config.maxDimension) / height)
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      if ("close" in bitmap && typeof bitmap.close === "function") {
        bitmap.close()
      }
      return file
    }

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    if ("close" in bitmap && typeof bitmap.close === "function") {
      bitmap.close()
    }

    const targetType = config.mimeType
    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), targetType, config.quality)
    })

    if (!blob || blob.size >= file.size) {
      return file
    }

    const dotIndex = file.name.lastIndexOf(".")
    const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name
    const newExtension = targetType === "image/webp" ? ".webp" : ".jpg"
    const newName = `${baseName}${newExtension}`

    return new File([blob], newName, {
      type: targetType,
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
