const PRODUCTION_SITE_URL = "https://kiaskincare.in";

function getPublicSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");

  if (
    !configured ||
    configured.includes("localhost") ||
    configured.includes("127.0.0.1") ||
    configured.includes("ozogroupwebsite-git-") ||
    configured.includes("ozo")
  ) {
    return PRODUCTION_SITE_URL;
  }

  return configured;
}

export function getReferralUrl(partnerCode: string) {
  return `${getPublicSiteUrl()}/${encodeURIComponent(partnerCode)}`;
}
