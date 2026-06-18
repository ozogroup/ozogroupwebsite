"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function TreatmentGallery({
  images,
  alt,
  priority = false,
  compact = false,
}: {
  images: string[];
  alt: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const cleanImages = Array.from(new Set(images.filter(Boolean)));
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = cleanImages[activeIndex];

  if (!activeImage) return null;

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + cleanImages.length) % cleanImages.length);
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-video w-full overflow-hidden rounded-[24px] bg-[#F8F4EC]"
      >
        <Image
          src={activeImage}
          alt={`${alt}${cleanImages.length > 1 ? ` image ${activeIndex + 1}` : ""}`}
          fill
          priority={priority}
          sizes={compact ? "(max-width: 768px) 100vw, 600px" : "(max-width: 1024px) 90vw, 600px"}
          className="object-cover object-center"
        />
        {cleanImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-brand-ink shadow-soft transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-brand-ink shadow-soft transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-brand-ink/80 px-3 py-1 text-xs font-semibold text-white">
              {activeIndex + 1} / {cleanImages.length}
            </span>
          </>
        )}
      </div>

      {cleanImages.length > 1 && !compact && (
        <div className="grid grid-cols-4 gap-2">
          {cleanImages.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-[#F8F4EC] ${
                activeIndex === index ? "border-brand-accent ring-2 ring-brand-accent/20" : "border-brand-border"
              }`}
            >
              <Image src={image} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
