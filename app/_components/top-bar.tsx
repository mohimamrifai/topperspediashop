import Image from "next/image";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-100 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-2xl items-center px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.webp"
            alt="TopperspediaShop"
            width={140}
            height={36}
            priority
            className="h-12 w-12"
          />
        </Link>
      </div>
    </header>
  );
}
