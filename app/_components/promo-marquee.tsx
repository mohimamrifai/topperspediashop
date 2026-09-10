const TEXT =
  "Ayo, manfaatkan teknologi dan platform digital untuk mengembangkan produk unggulan! Dengan kreativitas, inovasi, dan strategi pemasaran yang tepat, kita bisa meningkatkan daya saing produk lokal di pasar nasional dan internasional bersama Tokopedia.";

export function PromoMarquee() {
  return (
    <div className="group mt-3 overflow-hidden px-2 py-3 sm:mt-4 sm:px-3 sm:py-3.5">
      <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
        <span className="shrink-0 whitespace-nowrap pr-10 text-xs text-foreground sm:text-sm">
          {TEXT}
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 whitespace-nowrap pr-10 text-xs text-foreground sm:text-sm"
        >
          {TEXT}
        </span>
      </div>
    </div>
  );
}
