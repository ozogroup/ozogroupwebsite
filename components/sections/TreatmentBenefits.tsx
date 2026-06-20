import { readdir } from "fs/promises";
import Image from "next/image";
import Link from "next/link";
import path from "path";
import { getPublicSiteContent } from "@/lib/data/public";

const BENEFIT_IMAGE_DIRECTORY = path.join(process.cwd(), "public", "images", "treatment-benefits");
const BENEFIT_IMAGE_PUBLIC_PATH = "/images/treatment-benefits";

function parseManagedImages(value?: string) {
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

async function getUploadedBenefitImages() {
  try {
    const files = await readdir(BENEFIT_IMAGE_DIRECTORY);
    return files
      .filter((file) => /\.(avif|jpe?g|png|webp)$/i.test(file))
      .sort((a, b) => a.localeCompare(b))
      .map((file) => `${BENEFIT_IMAGE_PUBLIC_PATH}/${encodeURIComponent(file)}`);
  } catch {
    return [];
  }
}

function getImageAlt(image: string, index: number) {
  const fileName = decodeURIComponent(image.split("/").pop() || "")
    .replace(/\.[^.]+$/, "")
    .replace(/^\d+[-_]?/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  return fileName ? `KIA Skin Care ${fileName}` : `KIA Skin Care treatment benefit ${index + 1}`;
}

export default async function TreatmentBenefits() {
  const content = await getPublicSiteContent("treatment_benefits");
  const hasManagedGallery = typeof content.benefit_images === "string";
  const images = hasManagedGallery
    ? parseManagedImages(content.benefit_images)
    : await getUploadedBenefitImages();

  return (
    <section
      id="treatment-benefits"
      className="section relative overflow-hidden bg-gradient-to-b from-white via-brand-surface/70 to-white scroll-mt-24"
    >
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-white px-4 py-2 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">
              {content.benefits_eyebrow || "Visible Care Results"}
            </span>
          </div>
          <h2 className="mt-6">{content.benefits_heading || "Treatment Benefits"}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-brand-muted">
            {content.benefits_description ||
              "Explore the visible benefits and care-focused results of our professional skincare treatments."}
          </p>
        </div>

        {images.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image, index) => (
              <article
                key={image}
                className="overflow-hidden rounded-[32px] bg-white p-3 shadow-[0_10px_35px_rgba(0,0,0,0.06)]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-[#F5F2EB] p-2.5">
                  <div className="relative h-full w-full overflow-hidden rounded-[22px]">
                    <Image
                      src={image}
                      alt={getImageAlt(image, index)}
                      fill
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-contain object-center"
                      priority={index < 3}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="#treatments" className="btn-primary justify-center shadow-soft hover:shadow-card">
            Book Your Treatment
          </Link>
        </div>
      </div>
    </section>
  );
}
