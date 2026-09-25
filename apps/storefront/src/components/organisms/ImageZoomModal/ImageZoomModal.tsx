"use client"

import { useCallback, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/icons"

interface ImageZoomModalProps {
  isOpen: boolean
  onClose: () => void
  images: HttpTypes.StoreProduct["images"]
  initialIndex?: number
}

export const ImageZoomModal = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
}: ImageZoomModalProps) => {
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsZoomed(false)
    }
  }, [isOpen, initialIndex])

  const handlePrev = useCallback(() => {
    if (!images?.length) return
    setIsZoomed(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images])

  const handleNext = useCallback(() => {
    if (!images?.length) return
    setIsZoomed(false)
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft") {
        handlePrev()
      } else if (e.key === "ArrowRight") {
        handleNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose, handlePrev, handleNext])

  if (!isOpen || !images?.length || !mounted) return null

  const currentImage = images[currentIndex]
  if (!currentImage?.url) return null

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const toggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setZoomPosition({ x, y })
      setIsZoomed(true)
    } else {
      setIsZoomed(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/95 backdrop-blur-md select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Product image gallery"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 text-white z-10">
        <span className="text-sm font-medium text-neutral-400 tracking-wider">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition cursor-pointer"
        >
          <CloseIcon size={22} color="#ffffff" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition border border-white/10 cursor-pointer"
            >
              <ArrowLeftIcon size={22} color="#ffffff" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition border border-white/10 cursor-pointer"
            >
              <ArrowRightIcon size={22} color="#ffffff" />
            </button>
          </>
        )}

        <div
          onClick={toggleZoom}
          onMouseMove={handleMouseMove}
          className={`relative max-w-full max-h-full flex items-center justify-center ${
            isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
          }`}
          style={{ width: "90vw", height: "82vh" }}
        >
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
            style={
              isZoomed
                ? {
                    transform: "scale(2.5)",
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
          >
            <Image
              src={decodeURIComponent(currentImage.url)}
              alt="Product view"
              fill
              unoptimized
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-4 px-6 overflow-x-auto z-10">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => {
                setIsZoomed(false)
                setCurrentIndex(idx)
              }}
              className={`relative w-14 h-14 rounded overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                currentIndex === idx
                  ? "border-white opacity-100 scale-105"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={decodeURIComponent(img.url)}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
