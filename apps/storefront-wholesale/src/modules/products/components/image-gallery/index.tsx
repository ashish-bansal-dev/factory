"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import { useState } from "react"
import { ImageZoomModal } from "../image-zoom-modal"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden bg-sand-50 flex items-center justify-center rounded-2xl border border-stone-200">
        <span className="text-stone-400 text-xs">No image available</span>
      </div>
    )
  }

  // Multi-image side-by-side 2x2 / 4-grid view visible in single viewport
  const displayImages = images.slice(0, 4)
  const remainingCount = images.length - 4

  const handleOpenZoom = (index: number) => {
    setSelectedIdx(index)
    setIsZoomOpen(true)
  }

  return (
    <div className="flex flex-col gap-2.5 w-full font-sans">
      {images.length === 1 ? (
        /* Single Image View */
        <div
          onClick={() => handleOpenZoom(0)}
          className="relative aspect-square sm:aspect-[4/3] w-full overflow-hidden bg-sand-50 rounded-2xl border border-stone-200 shadow-xs cursor-zoom-in group"
        >
          <Image
            src={images[0].url}
            priority
            className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            alt="Product view"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-charcoal-900 border border-stone-200 shadow-xs opacity-80 group-hover:opacity-100 transition">
            Tap to zoom
          </div>
        </div>
      ) : (
        /* Side-by-side 2x2 Grid (Compact so it fits within a single viewport with variant matrix) */
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full">
          {displayImages.map((image, index) => {
            const isLastOfFour = index === 3 && remainingCount > 0

            return (
              <div
                key={image.id || index}
                onClick={() => handleOpenZoom(index)}
                className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-sand-50 border border-stone-200 shadow-2xs cursor-zoom-in group transition-all hover:border-stone-300"
              >
                <Image
                  src={image.url}
                  priority={index < 2}
                  className="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  alt={`Product view ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Overlay if there are more than 4 images */}
                {isLastOfFour ? (
                  <div className="absolute inset-0 bg-charcoal-900/60 flex flex-col items-center justify-center text-white backdrop-blur-2xs transition group-hover:bg-charcoal-900/70">
                    <span className="font-serif text-lg sm:text-xl font-bold">
                      +{remainingCount}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      More Photos
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-charcoal-900 opacity-0 group-hover:opacity-100 transition shadow-xs">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Mini Thumbnails indicator strip if > 4 images */}
      {images.length > 4 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              type="button"
              onClick={() => handleOpenZoom(i)}
              className={clx(
                "relative w-10 h-10 rounded-lg overflow-hidden border shrink-0 bg-sand-50 transition-all",
                selectedIdx === i
                  ? "border-terracotta-600 ring-1 ring-terracotta-600"
                  : "border-stone-200 opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={img.url}
                alt={`Angle ${i + 1}`}
                fill
                className="object-cover"
                sizes="40px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full screen zoom modal */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        images={images}
        initialIndex={selectedIdx}
      />
    </div>
  )
}

export default ImageGallery
