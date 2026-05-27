import Image from "next/image";
import Link from "next/link";

export function BrandLink() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <Image
        src="/images/clapperboard.png"
        alt=""
        aria-hidden
        width={20}
        height={20}
        className="size-5"
      />
      <span className="text-sm font-semibold">Motion Studio</span>
    </Link>
  );
}
