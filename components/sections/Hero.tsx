import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full">
      {/* Desktop banner */}
      <div className="hidden md:block">
        <Image
          src="/images/hero-desktop.jpg"
          alt="KIA Group — One Membership, Multiple Business Opportunities"
          width={1600}
          height={600}
          priority
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>

      {/* Mobile banner */}
      <div className="block md:hidden">
        <Image
          src="/images/hero-mobile.jpg"
          alt="KIA Group — One Membership, Multiple Business Opportunities"
          width={800}
          height={1200}
          priority
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>
    </section>
  );
}
