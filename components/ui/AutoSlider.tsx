"use client";

import {
  Children,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AutoSliderProps {
  ariaLabel: string;
  children: ReactNode;
  itemClassName?: string;
  desktopItems?: number;
  tabletItems?: number;
  intervalMs?: number;
}

export default function AutoSlider({
  ariaLabel,
  children,
  itemClassName = "basis-full",
  desktopItems = 1,
  tabletItems = 1,
  intervalMs = 2000,
}: AutoSliderProps) {
  const slides = useMemo(() => Children.toArray(children), [children]);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const positionCount = Math.max(1, slides.length - visibleItems + 1);

  const scrollToIndex = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const target = viewport?.children.item(index) as HTMLElement | null;
    const first = viewport?.children.item(0) as HTMLElement | null;

    if (!viewport || !target || !first) return;

    viewport.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const updateVisibleItems = () => {
      const nextCount =
        window.innerWidth >= 1024
          ? desktopItems
          : window.innerWidth >= 768
            ? tabletItems
            : 1;
      setVisibleItems(Math.max(1, nextCount));
    };

    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, [desktopItems, tabletItems]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(preference.matches);

    updatePreference();
    preference.addEventListener("change", updatePreference);
    return () => preference.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeIndex >= positionCount) {
      setActiveIndex(positionCount - 1);
      scrollToIndex(positionCount - 1);
    }
  }, [activeIndex, positionCount, scrollToIndex]);

  useEffect(() => {
    if (
      slides.length < 2 ||
      positionCount < 2 ||
      isHovered ||
      isFocused ||
      isTouching ||
      !isInView ||
      reduceMotion
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % positionCount;
        scrollToIndex(next);
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [
    intervalMs,
    isFocused,
    isHovered,
    isTouching,
    isInView,
    positionCount,
    reduceMotion,
    scrollToIndex,
    slides.length,
  ]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  function handleScroll() {
    const viewport = viewportRef.current;
    const first = viewport?.children.item(0) as HTMLElement | null;
    if (!viewport || !first) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < positionCount; index += 1) {
        const slide = viewport.children.item(index) as HTMLElement | null;
        if (!slide) continue;
        const distance = Math.abs(
          slide.offsetLeft - first.offsetLeft - viewport.scrollLeft
        );

        if (distance < closestDistance) {
          closestIndex = index;
          closestDistance = distance;
        }
      }

      setActiveIndex(closestIndex);
    });
  }

  function chooseSlide(index: number) {
    setActiveIndex(index);
    scrollToIndex(index);
  }

  function move(direction: -1 | 1) {
    const next = (activeIndex + direction + positionCount) % positionCount;
    chooseSlide(next);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      onTouchStart={() => setIsTouching(true)}
      onTouchEnd={() => setIsTouching(false)}
    >
      <div
        ref={viewportRef}
        onScroll={handleScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className="scrollbar-hide flex touch-pan-x snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
      >
        {slides.map((slide, index) => (
          <div key={index} className={`shrink-0 snap-start ${itemClassName}`}>
            {slide}
          </div>
        ))}
      </div>

      {positionCount > 1 && (
        <>
          <button
            type="button"
            aria-label={`Previous ${ariaLabel} slide`}
            onClick={() => move(-1)}
            className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-brand-ink shadow-card backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent md:-left-5 md:h-11 md:w-11"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Next ${ariaLabel} slide`}
            onClick={() => move(1)}
            className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-brand-ink shadow-card backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent md:-right-5 md:h-11 md:w-11"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
          </button>
        </>
      )}

      {positionCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: positionCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              aria-current={activeIndex === index}
              onClick={() => chooseSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-7 bg-brand-primaryDark"
                  : "w-2 bg-brand-border hover:bg-brand-primary"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
