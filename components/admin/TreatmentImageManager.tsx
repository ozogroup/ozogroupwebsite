"use client";

import { ChevronLeft, ChevronRight, ImagePlus, RotateCcw, Star, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useRef, useState } from "react";

export type ExistingTreatmentImage = {
  id: string;
  public_url: string;
  storage_path?: string | null;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type PendingTreatmentImage = {
  id: string;
  file: File;
  previewUrl: string;
  alt_text: string;
};

type Props = {
  existingImages: ExistingTreatmentImage[];
  pendingImages: PendingTreatmentImage[];
  primaryImageKey: string;
  saving?: boolean;
  error?: string;
  onExistingImagesChange: (images: ExistingTreatmentImage[]) => void;
  onPendingImagesChange: (images: PendingTreatmentImage[]) => void;
  onRemovedExistingImage: (image: ExistingTreatmentImage) => void;
  onPrimaryImageKeyChange: (key: string) => void;
};

const allowedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const maxSize = 8 * 1024 * 1024;

function createPendingImage(file: File): PendingTreatmentImage {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
    alt_text: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
  };
}

export default function TreatmentImageManager({
  existingImages,
  pendingImages,
  primaryImageKey,
  saving = false,
  error,
  onExistingImagesChange,
  onPendingImagesChange,
  onRemovedExistingImage,
  onPrimaryImageKeyChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  const totalCount = existingImages.length + pendingImages.length;

  const imageCards = useMemo(
    () => [
      ...existingImages.map((image) => ({
        key: `existing:${image.id}`,
        source: "existing" as const,
        id: image.id,
        url: image.public_url,
        alt: image.alt_text || "",
      })),
      ...pendingImages.map((image, index) => ({
        key: `new:${index}`,
        source: "pending" as const,
        id: image.id,
        url: image.previewUrl,
        alt: image.alt_text,
      })),
    ],
    [existingImages, pendingImages]
  );

  function addFiles(files: FileList | File[]) {
    setLocalError("");
    const accepted: PendingTreatmentImage[] = [];
    const rejected: string[] = [];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.has(file.type)) {
        rejected.push(`${file.name} is not a supported image.`);
        return;
      }
      if (file.size > maxSize) {
        rejected.push(`${file.name} is larger than 8 MB.`);
        return;
      }
      accepted.push(createPendingImage(file));
    });

    if (rejected.length) setLocalError(rejected.join(" "));
    if (!accepted.length) return;

    const nextPending = [...pendingImages, ...accepted];
    onPendingImagesChange(nextPending);

    if (!primaryImageKey && totalCount === 0) {
      onPrimaryImageKeyChange("new:0");
    }
  }

  function moveExisting(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= existingImages.length) return;
    const next = [...existingImages];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onExistingImagesChange(next.map((image, sort_order) => ({ ...image, sort_order })));
  }

  function movePending(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= pendingImages.length) return;
    const next = [...pendingImages];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onPendingImagesChange(next);
    if (primaryImageKey === `new:${index}`) onPrimaryImageKeyChange(`new:${nextIndex}`);
    if (primaryImageKey === `new:${nextIndex}`) onPrimaryImageKeyChange(`new:${index}`);
  }

  function removeExisting(image: ExistingTreatmentImage) {
    onRemovedExistingImage(image);
    const next = existingImages.filter((item) => item.id !== image.id);
    onExistingImagesChange(next.map((item, sort_order) => ({ ...item, sort_order })));
    if (primaryImageKey === `existing:${image.id}`) {
      if (next[0]) onPrimaryImageKeyChange(`existing:${next[0].id}`);
      else if (pendingImages[0]) onPrimaryImageKeyChange("new:0");
      else onPrimaryImageKeyChange("");
    }
  }

  function removePending(index: number) {
    const image = pendingImages[index];
    URL.revokeObjectURL(image.previewUrl);
    const next = pendingImages.filter((_, current) => current !== index);
    onPendingImagesChange(next);
    if (primaryImageKey === `new:${index}`) {
      if (existingImages[0]) onPrimaryImageKeyChange(`existing:${existingImages[0].id}`);
      else if (next[0]) onPrimaryImageKeyChange("new:0");
      else onPrimaryImageKeyChange("");
    }
  }

  function updateAlt(source: "existing" | "pending", index: number, altText: string) {
    if (source === "existing") {
      onExistingImagesChange(
        existingImages.map((image, current) => current === index ? { ...image, alt_text: altText } : image)
      );
      return;
    }

    onPendingImagesChange(
      pendingImages.map((image, current) => current === index ? { ...image, alt_text: altText } : image)
    );
  }

  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface/40 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink">Treatment Images</h3>
          <p className="text-xs text-brand-muted">JPG, PNG, or WEBP. Maximum 8 MB per image.</p>
        </div>
        <span className="text-xs font-medium text-brand-muted">{totalCount} image{totalCount === 1 ? "" : "s"}</span>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-xl border border-dashed p-5 text-center transition ${
          dragging ? "border-brand-accent bg-white" : "border-brand-border bg-white/70"
        }`}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-brand-accent" />
        <p className="mt-2 text-sm font-medium text-brand-ink">Drag images here or choose from device</p>
        <p className="mt-1 text-xs text-brand-muted">You can add more images without replacing existing ones.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-ink transition hover:border-brand-accent disabled:opacity-50"
        >
          <ImagePlus className="h-4 w-4" />
          Add Images
        </button>
      </div>

      {(localError || error) && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {localError || error}
        </div>
      )}

      {imageCards.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {imageCards.map((card, index) => {
            const existingIndex = existingImages.findIndex((image) => image.id === card.id);
            const pendingIndex = pendingImages.findIndex((image) => image.id === card.id);
            const isPrimary = primaryImageKey === card.key;

            return (
              <div key={card.key} className="rounded-xl border border-brand-border bg-white p-3">
                <div className="relative overflow-hidden rounded-lg bg-brand-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.url} alt={card.alt || "Treatment image"} className="aspect-video w-full object-contain" />
                  {isPrimary && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Primary
                    </span>
                  )}
                  {card.source === "pending" && (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                      New
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={card.alt}
                    onChange={(event) => updateAlt(card.source, card.source === "existing" ? existingIndex : pendingIndex, event.target.value)}
                    placeholder="Image alt text"
                    className="w-full rounded-lg border border-brand-border px-3 py-2 text-sm outline-none transition focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                  />

                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      disabled={saving || index === 0}
                      onClick={() => card.source === "existing" ? moveExisting(existingIndex, -1) : movePending(pendingIndex, -1)}
                      className="rounded p-2 text-brand-muted hover:bg-brand-surface disabled:opacity-30"
                      title="Move earlier"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={saving || index === imageCards.length - 1}
                      onClick={() => card.source === "existing" ? moveExisting(existingIndex, 1) : movePending(pendingIndex, 1)}
                      className="rounded p-2 text-brand-muted hover:bg-brand-surface disabled:opacity-30"
                      title="Move later"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => onPrimaryImageKeyChange(card.key)}
                      className={`rounded px-3 py-2 text-xs font-semibold transition ${
                        isPrimary ? "bg-brand-ink text-white" : "bg-brand-surface text-brand-ink hover:bg-brand-light/60"
                      }`}
                    >
                      Make Primary
                    </button>
                    {card.source === "pending" && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => inputRef.current?.click()}
                        className="rounded p-2 text-brand-muted hover:bg-brand-surface disabled:opacity-30"
                        title="Retry upload by selecting again"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => card.source === "existing" ? removeExisting(existingImages[existingIndex]) : removePending(pendingIndex)}
                      className="ml-auto rounded p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                      title="Remove image"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saving && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-border">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-accent" />
        </div>
      )}
    </section>
  );
}
