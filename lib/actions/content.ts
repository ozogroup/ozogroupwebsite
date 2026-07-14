"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

// =====================================================
// SITE CONTENT ACTIONS
// =====================================================

export async function getSiteContent(section?: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  let query = supabase.from("site_content" as any).select("*").order("display_order", { ascending: true });
  
  if (section) {
    query = query.eq("section", section);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching site content:", error);
    return [];
  }
  
  return data || [];
}

export async function updateSiteContent(id: string, value: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  const { data, error } = await supabase
    .from("site_content" as any)
    .update({ value, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating site content:", error);
    throw error;
  }
  
  revalidatePath("/admin/content");
  revalidatePublicContent();
  return data;
}

export async function updateSiteContentBulk(updates: { id: string; value: string }[]) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  for (const update of updates) {
    const { error } = await supabase
      .from("site_content" as any)
      .update({ value: update.value, updated_at: new Date().toISOString() })
      .eq("id", update.id);
    
    if (error) {
      console.error("Error updating site content:", error);
      throw error;
    }
  }
  
  revalidatePath("/admin/content");
  revalidatePublicContent();
  return { success: true };
}

export async function saveSiteContent(input: {
  id?: string;
  page?: string | null;
  section: string;
  content_key?: string | null;
  key_name: string;
  value?: string | null;
  value_type?: string | null;
  display_order?: number | null;
  is_active?: boolean | null;
}) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const payload = {
    page: input.page || "home",
    section: input.section,
    content_key: input.content_key || input.key_name,
    key_name: input.key_name || input.content_key,
    value: input.value || "",
    value_type: input.value_type || "text",
    display_order: input.display_order ?? 0,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const query = input.id
    ? supabase.from("site_content" as any).update(payload).eq("id", input.id)
    : supabase.from("site_content" as any).insert({
        ...payload,
        created_at: new Date().toISOString(),
      });

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Error saving site content:", error);
    throw error;
  }

  revalidatePath("/admin/content");
  revalidatePublicContent();
  return data;
}

export async function deleteSiteContent(id: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase
    .from("site_content" as any)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting site content:", error);
    throw error;
  }

  revalidatePath("/admin/content");
  revalidatePublicContent();
  return { success: true };
}

function revalidatePublicContent() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/referral");
  revalidatePath("/membership");
}
