"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";
import type { CarImageRow } from "@/lib/vehicles/queries";

interface CarGalleryProps {
  images: Pick<CarImageRow, "image_url">[];
  name: string;
  brand: string;
  dict: Dictionary;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.5; // px per ms

export function CarGallery({ images, name, brand, dict }: CarGalleryProps) {
  const [active, setActive] = React.useState(0);
  const [drag, setDrag] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [viewportW, setViewportW] = React.useState(0);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const pointerStartRef = React.useRef<{ x: number; t: number } | null>(null);

  const count = images.length;
  const safeActive = count > 0 ? Math.min(active, count - 1) : 0;
  const isRtl =
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("dir") === "rtl";

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (nextIndex: number) => {
    setActive(Math.max(0, Math.min(count - 1, nextIndex)));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (count <= 1) return;
    pointerStartRef.current = { x: e.clientX, t: e.timeStamp };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    setDrag(e.clientX - pointerStartRef.current.x);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    setDragging(false);
    setDrag(0);
    if (!start) return;

    const dx = e.clientX - start.x;
    const dt = e.timeStamp - start.t;
    const distance = Math.abs(dx);
    const velocity = dt > 0 ? distance / dt : 0;

    // Content follows the finger, so in RTL a rightward swipe reveals the
    // next slide, while in LTR a leftward swipe does.
    const advance = isRtl ? dx > 0 : dx < 0;
    const change = distance > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY;
    if (change) go(safeActive + (advance ? 1 : -1));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => endDrag(e);
  const onPointerCancel = () => {
    pointerStartRef.current = null;
    setDragging(false);
    setDrag(0);
  };

  const trackX = isRtl
    ? safeActive * viewportW + drag
    : -safeActive * viewportW + drag;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div
        ref={viewportRef}
        className="group relative aspect-[16/10] touch-pan-y select-none overflow-hidden bg-secondary will-change-transform"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {count > 0 ? (
          <div
            className={cn("flex h-full", !dragging && "transition-transform duration-300 ease-out")}
            style={{ transform: `translate3d(${trackX}px,0,0)` }}
          >
            {images.map((image, index) => (
              <div key={image.image_url} className="h-full w-full shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={dict.carDetail.galleryAlt
                    .replace("{name}", name)
                    .replace("{n}", String(index + 1))}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent/10 text-accent">
            <span className="font-display text-5xl font-bold">
              {brand?.[0] ?? "R"}
            </span>
          </div>
        )}

        {count > 1 ? (
          <span className="absolute end-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            {safeActive + 1} / {images.length}
          </span>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto p-3">
          {images.map((image, index) => (
            <button
              key={image.image_url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={dict.carDetail.galleryAlt
                .replace("{name}", name)
                .replace("{n}", String(index + 1))}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === safeActive
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.image_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}