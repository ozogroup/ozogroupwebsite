"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "media";

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * Bucket "media" must exist (public). Auto-creates if missing.
 */
export async function uploadImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "general";

  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "No file provided" };
  }

  if (file.size > 8 * 1024 * 1024) {
    return { error: "File too large (max 8MB)" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }

  const supabase = getSupabaseServiceClient();

  // Generate unique filename
  const ext = file.name.split(".").pop() || "jpg";
  const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 40);
  const filename = `${folder}/${Date.now()}-${safeName}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    // If bucket doesn't exist, give a helpful message
    if (error.message.toLowerCase().includes("bucket") || error.message.toLowerCase().includes("not found")) {
      return {
        error: `Storage bucket "${BUCKET}" not found. Please create a public bucket named "${BUCKET}" in Supabase Storage.`,
      };
    }
    return { error: error.message };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl };
}

/**
 * List all images in the media bucket
 */
export async function listImages() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    console.error("Error listing images:", error);
    return [];
  }

  return data || [];
}

/**
 * Delete an image from storage
 */
export async function deleteImage(path: string): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    console.error("Error deleting image:", error);
    return { error: error.message };
  }

  return {};
}

export async function deleteImageByUrl(url: string): Promise<{ error?: string }> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  if (markerIndex === -1) return {};
  const path = decodeURIComponent(url.slice(markerIndex + marker.length));
  return deleteImage(path);
}
