"use client";

import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { deleteImageByUrl, uploadImage } from "@/lib/actions/storage";

export default function MultiImageUpload({
  value,
  onChange,
  folder = "treatments",
  label = "Gallery Images",
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const result = await uploadImage(formData);
      if (result.url) uploaded.push(result.url);
      if (result.error) {
        setError(result.error);
        break;
      }
    }

    if (uploaded.length) onChange(Array.from(new Set([...value, ...uploaded])));
    setUploading(false);
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= value.length) return;
    const next = [...value];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  async function remove(url: string) {
    onChange(value.filter((item) => item !== url));
    await deleteImageByUrl(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-brand-ink">{label}</label>
        <span className="text-xs text-brand-muted">{value.length} image{value.length === 1 ? "" : "s"}</span>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, index) => (
            <div key={`${url}-${index}`} className="rounded-lg border border-brand-border bg-brand-surface p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full rounded-md bg-white object-contain" />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-muted">#{index + 1}</span>
                <div className="flex items-center gap-1">
                  <button type="button" title="Move left" disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-brand-muted hover:bg-white disabled:opacity-30">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" title="Move right" disabled={index === value.length - 1} onClick={() => move(index, 1)} className="rounded p-1 text-brand-muted hover:bg-white disabled:opacity-30">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" title="Delete image" onClick={() => remove(url)} className="rounded p-1 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { upload(event.target.files); event.target.value = ""; }} />
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-ink transition hover:border-brand-accent disabled:opacity-50">
        <ImagePlus className="h-4 w-4" />
        {uploading ? "Uploading..." : "Add Images"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
