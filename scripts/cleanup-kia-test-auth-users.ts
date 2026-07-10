import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const EXPECTED_PROJECT_REF = "clagbybuxaumyroknjai";
const REQUIRED_CONFIRMATION = "DELETE_KIA_TEST_AUTH_USERS";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadEnvFile(path.join(process.cwd(), ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const confirmation = process.env.AUTH_CLEANUP_CONFIRMATION || "";
  const expectedProjectRef = process.env.EXPECTED_SUPABASE_PROJECT_REF || "";

  if (!supabaseUrl.includes(EXPECTED_PROJECT_REF)) {
    throw new Error("Blocked: NEXT_PUBLIC_SUPABASE_URL does not match the expected KIA project.");
  }

  if (expectedProjectRef !== EXPECTED_PROJECT_REF) {
    throw new Error("Blocked: EXPECTED_SUPABASE_PROJECT_REF must match the KIA project reference.");
  }

  if (confirmation !== REQUIRED_CONFIRMATION) {
    throw new Error(`Blocked: AUTH_CLEANUP_CONFIRMATION must equal ${REQUIRED_CONFIRMATION}.`);
  }

  if (!serviceRoleKey) {
    throw new Error("Blocked: SUPABASE_SERVICE_ROLE_KEY is required and must remain server-only.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminProfiles, error: adminError } = await supabase
    .from("profiles")
    .select("id,email,role")
    .in("role", ["super_admin", "admin"]);

  if (adminError) throw adminError;

  const preservedIds = new Set((adminProfiles || []).map((profile) => String(profile.id)));
  const preservedEmails = new Set(
    (adminProfiles || [])
      .map((profile) => String(profile.email || "").toLowerCase())
      .filter(Boolean)
  );

  let page = 1;
  const perPage = 1000;
  let deletedCount = 0;
  let preservedCount = 0;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users || [];
    if (users.length === 0) break;

    for (const user of users) {
      const email = String(user.email || "").toLowerCase();
      const preserve = preservedIds.has(user.id) || preservedEmails.has(email);

      if (preserve) {
        preservedCount += 1;
        continue;
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Could not delete auth user ${user.id}: ${deleteError.message}`);
        continue;
      }
      deletedCount += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  console.log(`Preserved admin auth users: ${preservedCount}`);
  console.log(`Deleted non-admin auth users: ${deletedCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
