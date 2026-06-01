export function getOfferingTypeLabel(type?: string | null) {
  const normalized = (type || "").replace("_", "-").toLowerCase();
  if (normalized === "home-kit") return "Kit";
  if (normalized === "campaign" || normalized === "camp") return "Campaign";
  return "Treatment";
}

export function getOfferingCtaLabel(type?: string | null) {
  const label = getOfferingTypeLabel(type);
  if (label === "Kit") return "Book Kit";
  if (label === "Campaign") return "Enquire Now";
  return "Book Treatment";
}
