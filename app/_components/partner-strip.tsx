import Image from "next/image";

const partners = [
  { src: "/sponsor/mitra1.webp", alt: "Mitra 1" },
  { src: "/sponsor/mitra2.webp", alt: "Mitra 2" },
  { src: "/sponsor/mitra3.webp", alt: "Mitra 3" },
  { src: "/sponsor/mitra4.webp", alt: "Mitra 4" },
  { src: "/sponsor/mitra5.webp", alt: "Mitra 5" },
  { src: "/sponsor/mitra6.webp", alt: "Mitra 6" },
];

export function PartnerStrip() {
  return (
    <section className="mt-6 sm:mt-8">
      <h2 className="text-sm font-semibold text-foreground sm:text-base">
        Partner Kami
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {partners.map(({ src, alt }) => (
          <Image
            key={src}
            src={src}
            alt={alt}
            width={160}
            height={107}
            loading="lazy"
            className="h-auto w-full"
          />
        ))}
      </div>
    </section>
  );
}
