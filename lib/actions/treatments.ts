"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { treatmentKitCatalog, treatmentKitSlugs } from "@/lib/treatments/catalog";

const MEDIA_BUCKET = "media";
const MAX_TREATMENT_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TREATMENT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type TreatmentImageInput = {
  id?: string;
  storage_path?: string | null;
  public_url: string;
  alt_text?: string | null;
  sort_order: number;
  is_primary: boolean;
};

function parseJson<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const number = Number(typeof value === "string" ? value : "");
  return Number.isFinite(number) ? number : fallback;
}

function cleanString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function slugifyFileName(name: string) {
  const [base, ...rest] = name.split(".");
  const ext = (rest.pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeBase = (base || "treatment-image")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "treatment-image";
  return { safeBase, ext };
}

function normalizeImageRows(rows: any[] | null | undefined): TreatmentImageInput[] {
  return (rows || [])
    .map((row: any, index: number) => ({
      id: row.id,
      storage_path: row.storage_path || null,
      public_url: row.public_url || row.image_url || "",
      alt_text: row.alt_text || "",
      is_primary: Boolean(row.is_primary),
      sort_order: Number(row.sort_order ?? index),
    }))
    .filter((row) => row.public_url)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
}

function revalidateTreatmentCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/treatments");
  if (slug) revalidatePath(`/treatments/${slug}`);
  revalidatePath("/admin/treatments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/partner/dashboard");
  revalidatePath("/partner/new-membership");
}

export async function getAdminTreatmentsWithImages() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("treatments" as any)
    .select("*, treatment_images(*)")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading admin treatments:", error);
    return { error: error.message, data: [] };
  }

  const rows = (data || []).map((treatment: any) => {
    const imageRows = normalizeImageRows(treatment.treatment_images);
    const legacyGallery = Array.isArray(treatment.gallery) ? treatment.gallery : [];
    const fallbackImages = imageRows.length
      ? imageRows
      : Array.from(new Set([treatment.image, ...legacyGallery].filter(Boolean))).map((url, index) => ({
          id: `legacy-${index}-${url}`,
          storage_path: null,
          public_url: url,
          alt_text: treatment.image_alt || treatment.title || "",
          is_primary: index === 0,
          sort_order: index,
        }));

    return {
      ...treatment,
      treatment_images: fallbackImages,
      image: fallbackImages[0]?.public_url || treatment.image || "",
      gallery: fallbackImages.map((image) => image.public_url),
    };
  });

  return { data: rows };
}

async function uploadTreatmentImage({
  file,
  treatmentId,
  index,
}: {
  file: File;
  treatmentId: string;
  index: number;
}) {
  if (!ALLOWED_TREATMENT_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name}: only JPG, JPEG, PNG, and WEBP images are allowed.`);
  }

  if (file.size > MAX_TREATMENT_IMAGE_SIZE) {
    throw new Error(`${file.name}: image is too large. Maximum size is 8 MB.`);
  }

  const supabase = getSupabaseServiceClient();
  const { safeBase, ext } = slugifyFileName(file.name);
  const storagePath = `treatments/${treatmentId}/${Date.now()}-${index}-${safeBase}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });

  if (error) {
    throw new Error(`${file.name}: ${error.message}`);
  }

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}

export async function saveTreatmentWithImages(formData: FormData) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const id = cleanString(formData.get("id"));
  const title = cleanString(formData.get("title"));
  const slug = cleanString(formData.get("slug"));
  const price = parseNumber(formData.get("price"));
  const existingImages = parseJson<TreatmentImageInput[]>(formData.get("existingImages"), []);
  const removedImages = parseJson<TreatmentImageInput[]>(formData.get("removedImages"), []);
  const newImageAltTexts = parseJson<string[]>(formData.get("newImageAltTexts"), []);
  const primaryKey = cleanString(formData.get("primaryImageKey"));
  const uploadedPaths: string[] = [];

  if (!title) return { error: "Treatment title is required." };
  if (!slug) return { error: "Treatment slug is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Please enter a valid treatment price." };

  const treatmentPayload: Record<string, unknown> = {
    title,
    slug,
    type: cleanString(formData.get("type")) || "clinic",
    price,
    price_label:
      cleanString(formData.get("price_label")) ||
      `Rs. ${Number(price || 0).toLocaleString("en-IN")}`,
    kit_name: cleanString(formData.get("kit_name")) || title,
    unit: cleanString(formData.get("unit")) || "per session",
    subtitle: cleanString(formData.get("subtitle")),
    description: cleanString(formData.get("description")),
    overview: cleanString(formData.get("overview")),
    image_alt: cleanString(formData.get("image_alt")) || title,
    duration: cleanString(formData.get("duration")),
    sessions: cleanString(formData.get("sessions")),
    badge: cleanString(formData.get("badge")),
    benefits: parseJson<string[]>(formData.get("benefits"), []),
    safety: cleanString(formData.get("safety")),
    available_cities: parseJson<string[]>(formData.get("available_cities"), []),
    cta_text: cleanString(formData.get("cta_text")) || "Book Now",
    active: parseBoolean(formData.get("active")),
    is_active: parseBoolean(formData.get("active")),
    deleted_at: parseBoolean(formData.get("active")) ? null : new Date().toISOString(),
    featured: parseBoolean(formData.get("featured")),
    who_for: parseJson<string[]>(formData.get("who_for"), []),
    process: parseJson<Array<{ step: string; detail: string }>>(formData.get("process"), []),
    faqs: parseJson<Array<{ q: string; a: string }>>(formData.get("faqs"), []),
    seo_title: cleanString(formData.get("seo_title")) || null,
    seo_description: cleanString(formData.get("seo_description")) || null,
    sort_order: parseNumber(formData.get("sort_order"), 0),
    updated_at: new Date().toISOString(),
  };

  try {
    let treatmentId = id;
    let savedTreatment: any = null;

    if (treatmentId) {
      const { data, error } = await supabase
        .from("treatments" as any)
        .update(treatmentPayload)
        .eq("id", treatmentId)
        .select("*")
        .single();
      if (error) throw error;
      savedTreatment = data;
    } else {
      const { data, error } = await supabase
        .from("treatments" as any)
        .insert(treatmentPayload)
        .select("*")
        .single();
      if (error) throw error;
      savedTreatment = data;
      treatmentId = (data as any).id;
    }

    const newFiles = formData
      .getAll("newImages")
      .filter((value): value is File => value instanceof File && value.size > 0);

    const uploadedImages: TreatmentImageInput[] = [];
    for (let index = 0; index < newFiles.length; index += 1) {
      const upload = await uploadTreatmentImage({ file: newFiles[index], treatmentId, index });
      uploadedPaths.push(upload.storagePath);
      uploadedImages.push({
        public_url: upload.publicUrl,
        storage_path: upload.storagePath,
        alt_text: newImageAltTexts[index] || treatmentPayload.image_alt as string,
        sort_order: existingImages.length + index,
        is_primary: primaryKey === `new:${index}`,
      });
    }

    const retainedImages = existingImages
      .filter((image) => image.public_url)
      .map((image, index) => ({
        ...image,
        sort_order: index,
        is_primary: primaryKey === `existing:${image.id}` || image.is_primary,
      }));

    let finalImages = [...retainedImages, ...uploadedImages].map((image, index) => ({
      ...image,
      sort_order: index,
      is_primary:
        primaryKey === `existing:${image.id}` ||
        primaryKey === `new:${index - retainedImages.length}`,
    }));

    if (finalImages.length > 0 && !finalImages.some((image) => image.is_primary)) {
      finalImages = finalImages.map((image, index) => ({ ...image, is_primary: index === 0 }));
    }

    for (const image of finalImages) {
      const row = {
        treatment_id: treatmentId,
        storage_path: image.storage_path || null,
        public_url: image.public_url,
        image_url: image.public_url,
        alt_text: image.alt_text || treatmentPayload.image_alt || title,
        sort_order: image.sort_order,
        is_primary: image.is_primary,
        updated_at: new Date().toISOString(),
      };

      const query = image.id && !image.id.startsWith("legacy-")
        ? supabase.from("treatment_images" as any).update(row).eq("id", image.id)
        : supabase.from("treatment_images" as any).insert(row);

      const { error } = await query;
      if (error) throw error;
    }

    const removedIds = removedImages
      .map((image) => image.id)
      .filter((value): value is string => typeof value === "string" && !value.startsWith("legacy-"));

    if (removedIds.length > 0) {
      const { error } = await supabase
        .from("treatment_images" as any)
        .delete()
        .in("id", removedIds);
      if (error) throw error;
    }

    const legacyRemovedUrls = removedImages
      .filter((image) => !image.id || image.id.startsWith("legacy-"))
      .map((image) => image.public_url);

    const gallery = finalImages.map((image) => image.public_url);
    const primaryImage = finalImages.find((image) => image.is_primary)?.public_url || gallery[0] || "";

    const { error: imageSyncError } = await supabase
      .from("treatments" as any)
      .update({
        image: primaryImage || null,
        gallery,
        updated_at: new Date().toISOString(),
      })
      .eq("id", treatmentId);

    if (imageSyncError) throw imageSyncError;

    const removableStoragePaths = removedImages
      .filter((image) => image.storage_path && image.public_url && image.public_url.includes("/storage/v1/object/public/"))
      .map((image) => image.storage_path as string);

    if (removableStoragePaths.length > 0) {
      await supabase.storage.from(MEDIA_BUCKET).remove(removableStoragePaths);
    }

    if (legacyRemovedUrls.length > 0) {
      const remainingLegacy = gallery.filter((url) => !legacyRemovedUrls.includes(url));
      await supabase
        .from("treatments" as any)
        .update({
          gallery: remainingLegacy,
          image: remainingLegacy[0] || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", treatmentId);
    }

    revalidateTreatmentCatalog((savedTreatment as any)?.slug || slug);
    return { data: { id: treatmentId, slug } };
  } catch (error: any) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(MEDIA_BUCKET).remove(uploadedPaths);
    }
    console.error("Error saving treatment with images:", error);
    return { error: error?.message || "Treatment could not be saved." };
  }
}

export async function getTreatments() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching treatments:", error);
    return [];
  }

  return data;
}

export async function getTreatmentById(id: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatments" as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching treatment:", error);
    return null;
  }

  return data;
}

export async function createTreatment(formData: FormData) {
  "use server";

  const supabase = await getSupabaseServerClient();

  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const type = formData.get("type") as string;
  const price = formData.get("price") as string;
  const tagline = formData.get("tagline") as string;
  const description = formData.get("description") as string;
  const benefits = formData.get("benefits") as string;
  const duration = formData.get("duration") as string;
  const sessions = formData.get("sessions") as string;
  const image = formData.get("image") as string;
  const gallery = formData.get("gallery") as string;
  const featured = formData.get("featured") !== null;
  const active = formData.get("active") !== null;
  const requiresSlots = formData.get("requires_slots") !== null;
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase.from("treatments" as any).insert({
    title,
    slug,
    type: type as "home_kit" | "clinic" | "campaign",
    price: parseFloat(price) || 0,
    tagline,
    description,
    benefits: benefits ? JSON.parse(benefits) : [],
    duration,
    sessions,
    image,
    gallery: gallery ? JSON.parse(gallery) : image ? [image] : [],
    featured,
    active,
    requires_slots: requiresSlots,
    available_cities: availableCities ? JSON.parse(availableCities) : [],
  }).select().single();

  if (error) {
    console.error("Error creating treatment:", error);
    return { error: error.message };
  }

  revalidateTreatmentCatalog(slug);
  return { data };
}

export async function updateTreatment(formData: FormData) {
  "use server";

  const supabase = await getSupabaseServerClient();

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const type = formData.get("type") as string;
  const price = formData.get("price") as string;
  const tagline = formData.get("tagline") as string;
  const description = formData.get("description") as string;
  const benefits = formData.get("benefits") as string;
  const duration = formData.get("duration") as string;
  const sessions = formData.get("sessions") as string;
  const image = formData.get("image") as string;
  const gallery = formData.get("gallery") as string;
  const featured = formData.get("featured") !== null;
  const active = formData.get("active") !== null;
  const requiresSlots = formData.get("requires_slots") !== null;
  const availableCities = formData.get("available_cities") as string;

  const { data, error } = await supabase
    .from("treatments" as any)
    .update({
      title,
      slug,
      type: type as "home_kit" | "clinic" | "campaign",
      price: parseFloat(price) || 0,
      tagline,
      description,
      benefits: benefits ? JSON.parse(benefits) : [],
      duration,
      sessions,
      image,
      gallery: gallery ? JSON.parse(gallery) : image ? [image] : [],
      featured,
      active,
      requires_slots: requiresSlots,
      available_cities: availableCities ? JSON.parse(availableCities) : [],
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating treatment:", error);
    return { error: error.message };
  }

  revalidateTreatmentCatalog(slug);
  return { data };
}

export async function deleteTreatment(id: string) {
  "use server";

  const supabase = await getSupabaseServerClient();

  // SAFETY: bookings.treatment_id -> treatments(id) ON DELETE CASCADE.
  // Hard delete would destroy related bookings. Soft-delete (archive) instead.
  const { error } = await supabase
    .from("treatments" as any)
    .update({
      active: false,
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error deleting treatment:", error);
    return { error: error.message };
  }

  revalidateTreatmentCatalog();
  return { success: true };
}

export async function toggleTreatmentActive(id: string, active: boolean) {
  "use server";

  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("treatments" as any)
    .update({ active, is_active: active, deleted_at: active ? null : new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error toggling treatment active:", error);
    return { error: error.message };
  }

  revalidateTreatmentCatalog();
  return { success: true };
}

export async function ensureFinalTreatmentCatalog() {
  "use server";

  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const approvedSlugFilter = `(${treatmentKitSlugs.map((slug) => `"${slug}"`).join(",")})`;

  const { error: deactivateError } = await supabase
    .from("treatments" as any)
    .update({
      active: false,
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .not("slug", "in", approvedSlugFilter);

  if (deactivateError) {
    console.error("Error deactivating old treatments:", deactivateError);
    return { error: "Unable to prepare treatment catalog." };
  }

  const rows = treatmentKitCatalog.map((treatment) => ({
    slug: treatment.slug,
    title: treatment.title,
    type: treatment.type,
    price: treatment.price,
    price_label: treatment.priceLabel,
    unit: treatment.unit,
    tagline: treatment.tagline,
    subtitle: treatment.subtitle,
    description: treatment.description,
    overview: treatment.overview,
    benefits: treatment.benefits,
    process: treatment.process,
    process_steps: treatment.process,
    who_for: JSON.stringify(treatment.whoFor),
    safety: treatment.safety,
    faqs: treatment.faqs,
    duration: treatment.duration,
    sessions: treatment.sessions,
    badge: treatment.badge,
    icon: treatment.icon,
    tone: treatment.tone,
    image: treatment.image,
    gallery: treatment.gallery,
    image_alt: treatment.imageAlt,
    cta_text: treatment.note,
    active: true,
    is_active: true,
    featured: treatment.featured,
    requires_slots: treatment.requiresSlots,
    available_cities: treatment.availableCities,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("treatments" as any)
    .upsert(rows as any, { onConflict: "slug" });

  if (error) {
    console.error("Error seeding final treatments:", error);
    return { error: "Unable to sync final treatments. Please apply the treatment SQL migration first." };
  }

  revalidateTreatmentCatalog();
  return { success: true, count: rows.length };
}
