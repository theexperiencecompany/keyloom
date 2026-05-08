/**
 * Shim for `next/link`. Renders a plain <a>.
 */
import type { AnchorHTMLAttributes, ReactNode } from "react";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname: string };
  children?: ReactNode;
  prefetch?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  replace?: boolean;
  legacyBehavior?: boolean;
};

export default function Link({
  href,
  prefetch: _prefetch,
  scroll: _scroll,
  shallow: _shallow,
  passHref: _passHref,
  replace: _replace,
  legacyBehavior: _legacyBehavior,
  children,
  ...rest
}: LinkProps) {
  const url = typeof href === "string" ? href : (href?.pathname ?? "");
  return (
    <a href={url} {...rest}>
      {children}
    </a>
  );
}
