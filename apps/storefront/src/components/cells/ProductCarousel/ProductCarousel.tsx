"use client"

import { useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { ProductCarouselIndicator } from "@/components/molecules"
import { ImageZoomModal } from "@/components/organisms/ImageZoomModal/ImageZoomModal"
import { SearchIcon } from "@/icons"
import { useScreenSize } from "@/hooks/useScreenSize"

export const ProductCarousel = ({
  slides = [],
}: {
  slides: HttpTypes.StoreProduct["images"]
}) => {
  const screenSize = useScreenSize()
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis:
      screenSize === "xs" || screenSize === "sm" || screenSize === "md"
        ? "x"
        : "y",
    loop: true,
    align: "start",
  })

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => {
      setActiveSlideIndex(emblaApi.selectedScrollSnap())
    }
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  return (
    <div className="embla relative" data-testid="product-carousel">
      {/* Minimal, elegant expand button */}
      {slides?.length ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setZoomIndex(activeSlideIndex)
            setIsZoomOpen(true)
          }}
          aria-label="Expand product image"
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-black shadow-sm border border-neutral-200/80 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <SearchIcon size={16} color="currentColor" />
        </button>
      ) : null}

      <div
        className="embla__viewport overflow-hidden rounded-xs"
        ref={emblaRef}
        data-testid="product-carousel-viewport"
      >
        <div className="embla__container h-[350px] lg:h-fit max-h-[698px] flex lg:block" data-testid="product-carousel-container">
          {(slides || []).map((slide, idx) => (
            <div
              key={slide.id}
              onClick={() => {
                setZoomIndex(idx)
                setIsZoomOpen(true)
              }}
              className="embla__slide min-w-0 h-[350px] lg:h-fit cursor-zoom-in relative"
              data-testid={`product-carousel-slide-${idx}`}
            >
              <Image
                priority={idx === 0}
                fetchPriority={idx === 0 ? "high" : "auto"}
                src={decodeURIComponent(slide.url)}
                alt="Product image"
                width={700}
                height={700}
                quality={idx === 0 ? 85 : 70}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="max-h-[700px] w-full h-auto aspect-square object-contain object-center"
                data-testid={`product-carousel-image-${idx}`}
              />
            </div>
          ))}
        </div>
        {slides?.length ? (
          <ProductCarouselIndicator slides={slides} embla={emblaApi} />
        ) : null}
      </div>

      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        images={slides}
        initialIndex={zoomIndex}
      />
    </div>
  )
}
