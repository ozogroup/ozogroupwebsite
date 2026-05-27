import "server-only";

const NEW_PARTNER_PREFIX = "KIA";
const LEGACY_PARTNER_PREFIX = "OZO";
const FIRST_PARTNER_NUMBER = 1001;
const PARTNER_CODE_PATTERN = /^(?:KIA|OZO)(\d+)$/i;
const LEGACY_CODE_PATTERN = /^OZO(?=\d+$)/i;

export function normalizeKiaPartnerCode(code?: string | null) {
  return String(code || "").trim().toUpperCase().replace(LEGACY_CODE_PATTERN, NEW_PARTNER_PREFIX);
}

export function getNextKiaPartnerCode(existingCodes: Array<string | null | undefined>) {
  const highestNumber = existingCodes.reduce((highest, code) => {
    const match = PARTNER_CODE_PATTERN.exec(String(code || "").trim());
    if (!match) return highest;

    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, FIRST_PARTNER_NUMBER - 1);

  return `${NEW_PARTNER_PREFIX}${Math.max(FIRST_PARTNER_NUMBER, highestNumber + 1)}`;
}

export async function generateKiaPartnerCode(supabase: any) {
  const { data, error } = await supabase
    .from("partners")
    .select("partner_code")
    .or(`partner_code.ilike.${NEW_PARTNER_PREFIX}%,partner_code.ilike.${LEGACY_PARTNER_PREFIX}%`);

  if (error) {
    console.error("Error generating partner ID:", error);
    throw new Error("Unable to generate partner ID.");
  }

  return getNextKiaPartnerCode((data || []).map((row: any) => row.partner_code));
}

export function isPartnerCodeConflict(error: any) {
  return error?.code === "23505" && String(error?.message || "").includes("partner_code");
}
