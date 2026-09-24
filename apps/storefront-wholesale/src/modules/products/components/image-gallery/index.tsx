"use client"

import { HttpTypes } from "@medusajs/types"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIdx, setSelectedIdx] = useState(0)

  if (!images || images.length === 0) {
    return (
      <Container className="relative aspect-[4/5] w-full overflow-hidden bg-ui-bg-subtle flex items-center justify-center rounded-xl border border-ui-border-base">
        <span className="text-ui-fg-muted text-xs">No image available</span>
      </Container>
    )
  }

  const activeImage = images[selectedIdx] || images[0]

  return (
    <div className="flex flex-col gap-y-3 w-full">
      {/* Featured Main Image */}
      <Container
        id={activeImage.id}
        className="relative aspect-[4/5] w-full overflow-hidden bg-ui-bg-subtle rounded-xl border border-ui-border-base shadow-sm"
      >
        {activeImage.url && (
          <Image
            src={activeImage.url}
            priority
            className="absolute inset-0 object-cover w-full h-full"
            alt="Product image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
          />
        )}
      </Container>

      {/* Thumbnails (if multiple images) */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              type="button"
              onClick={() => setSelectedIdx(index)}
              className={clx(
                "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 bg-ui-bg-subtle cursor-pointer",
                selectedIdx === index
                  ? "border-emerald-600 ring-2 ring-emerald-600/20 opacity-100"
                  : "border-ui-border-base hover:border-ui-border-strong opacity-70 hover:opacity-100"
              )}
            >
              {image.url && (
                <Image
                  src={image.url}
                  className="object-cover"
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
