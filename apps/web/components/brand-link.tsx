import Link from "next/link";

export function BrandLink() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <img
        src="/images/clapperboard.png"
        alt=""
        aria-hidden
        className="size-5"
      />
      <span className="text-sm font-semibold">Motion Studio</span>
    </Link>
  );
}
